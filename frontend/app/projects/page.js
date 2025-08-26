'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:4000';
export default function Projects(){
  const [projects, setProjects] = useState([]);
  useEffect(()=>{ axios.get(API+'/projects').then(r=>setProjects(r.data.projects||[])).catch(()=>{}); },[]);
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {projects.map(p=> (
        <a key={p.id} href={`/projects/${p.id}`} className="card hover:shadow-lg transition">
          <div className="h-40 bg-gray-200 rounded-xl mb-4" />
          <div className="font-bold">{p.title}</div>
          <div className="text-sm text-gray-600 line-clamp-2">{p.description}</div>
          <div className="mt-2 text-xs text-gray-500">{p.visibility}</div>
        </a>
      ))}
    </div>
  )
}
