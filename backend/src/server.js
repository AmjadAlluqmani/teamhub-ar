import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive: true});
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helpers
function signToken(user){
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(required=true){
  return (req,res,next)=>{
    const h = req.headers.authorization||'';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if(!token){
      if(required) return res.status(401).json({error:'unauthorized'});
      req.user=null; return next();
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch(e){ return res.status(401).json({error:'invalid token'}); }
  }
}
function requireRole(roles){
  return (req,res,next)=>{
    if(!req.user || !roles.includes(req.user.role)) return res.status(403).json({error:'forbidden'});
    next();
  }
}

// Auth routes
app.post('/auth/login', async (req,res)=>{
  const {email, password} = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return res.status(401).json({error:'invalid credentials'});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({error:'invalid credentials'});
  return res.json({ token: signToken(user), user });
});

// Invite flow (admin creates code; user registers with it)
app.post('/auth/invite', auth(), requireRole(['admin']), async (req,res)=>{
  const { name, email, rolePreset='member', expiresAt=null } = req.body;
  const code = Math.random().toString(36).slice(2,8).toUpperCase();
  const inv = await prisma.invite.create({ data: { name, email, rolePreset, code, expiresAt, createdBy: req.user.id } });
  res.json({ invite: inv });
});
app.post('/auth/register', async (req,res)=>{
  const { code, email, password } = req.body;
  const inv = await prisma.invite.findUnique({ where: { code } });
  if(!inv || inv.used) return res.status(400).json({error:'invalid invite'});
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name: inv.name, email: email || inv.email || `${code.toLowerCase()}@example.com`, password: hash, role: inv.rolePreset } });
  await prisma.invite.update({ where: { id: inv.id }, data: { used: true } });
  res.json({ token: signToken(user), user });
});

// Users (admin only list)
app.get('/users', auth(), requireRole(['admin']), async (req,res)=>{
  const users = await prisma.user.findMany({});
  res.json({ users });
});
app.patch('/users/:id/role', auth(), requireRole(['admin']), async (req,res)=>{
  const { role } = req.body;
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ user: updated });
});

// Projects
app.post('/projects', auth(), requireRole(['admin','moderator']), async (req,res)=>{
  const { title, description, visibility='group_private', tags=[], techStack=[] } = req.body;
  const slug = (title||'proj').toLowerCase().replace(/\s+/g,'-') + '-' + Math.random().toString(36).slice(2,5);
  const project = await prisma.project.create({ data: { title, description, visibility, ownerId: req.user.id, slug, tags, techStack } });
  // owner as member
  await prisma.projectMember.create({ data: { projectId: project.id, userId: req.user.id, roleInProject: 'owner', addedBy: req.user.id } });
  res.json({ project });
});
app.get('/projects', auth(false), async (req,res)=>{
  const all = await prisma.project.findMany({ orderBy:{createdAt:'desc'} });
  // filter public if no auth or guest
  if(!req.user){
    return res.json({ projects: all.filter(p => ['personal_public','group_public'].includes(p.visibility)) });
  }
  // admin/moderator/member can see public + where member of private
  const memberships = await prisma.projectMember.findMany({ where: { userId: req.user.id } });
  const memberProjectIds = new Set(memberships.map(m=>m.projectId));
  const visible = all.filter(p=>{
    if(['personal_public','group_public'].includes(p.visibility)) return true;
    if(p.ownerId === req.user.id) return true;
    if(['group_private','personal_private'].includes(p.visibility)) return memberProjectIds.has(p.id);
    return false;
  });
  res.json({ projects: visible });
});
app.get('/projects/:id', auth(false), async (req,res)=>{
  const p = await prisma.project.findUnique({ where: { id: req.params.id } });
  if(!p) return res.status(404).json({error:'not found'});
  if(['personal_public','group_public'].includes(p.visibility)) return res.json({ project: p, details: null });
  // private: require membership
  if(!req.user) return res.status(403).json({error:'forbidden'});
  const mem = await prisma.projectMember.findFirst({ where: { userId: req.user.id, projectId: p.id } });
  if(!mem && p.ownerId !== req.user.id && req.user.role!=='admin') return res.status(403).json({error:'forbidden'});
  res.json({ project: p });
});

// Project members (owner or admin)
app.post('/projects/:id/members', auth(), async (req,res)=>{
  const projectId = req.params.id;
  const { userId, roleInProject='collaborator' } = req.body;
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if(!p) return res.status(404).json({error:'not found'});
  if(!(req.user.role==='admin' || p.ownerId===req.user.id)) return res.status(403).json({error:'forbidden'});
  const mem = await prisma.projectMember.create({ data: { projectId, userId, roleInProject, addedBy: req.user.id } });
  res.json({ member: mem });
});

// Files upload (basic)
app.post('/projects/:id/files', auth(), upload.single('file'), async (req,res)=>{
  const projectId = req.params.id;
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if(!p) return res.status(404).json({error:'not found'});
  const mem = await prisma.projectMember.findFirst({ where: { userId: req.user.id, projectId: p.id } });
  if(!(req.user.role==='admin' || p.ownerId===req.user.id || mem)) return res.status(403).json({error:'forbidden'});
  const kind = (req.file.mimetype||'application/octet-stream').split('/')[0];
  const file = await prisma.file.create({ data: { projectId, path: req.file.originalname, kind, createdBy: req.user.id } });
  const ver = await prisma.fileVersion.create({ data: { fileId: file.id, version: 1, storageUrl: req.file.path, size: req.file.size, hash: req.file.filename, createdBy: req.user.id } });
  await prisma.file.update({ where: { id: file.id }, data: { latestVersion: 1 } });
  res.json({ file, version: ver });
});

// Chat message
app.post('/projects/:id/messages', auth(), async (req,res)=>{
  const projectId = req.params.id;
  const { body, channel='general', replyToId=null } = req.body;
  const mem = await prisma.projectMember.findFirst({ where: { userId: req.user.id, projectId } });
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if(!(req.user.role==='admin' || p?.ownerId===req.user.id || mem)) return res.status(403).json({error:'forbidden'});
  const msg = await prisma.message.create({ data: { projectId, body, channel, replyToId, authorId: req.user.id, attachments: [] } });
  res.json({ message: msg });
});

app.get('/health', (_req,res)=>res.json({ok:true}));

app.listen(PORT, ()=>console.log('API on http://localhost:'+PORT));
