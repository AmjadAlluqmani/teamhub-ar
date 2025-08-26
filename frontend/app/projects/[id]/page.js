'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:4000';
export default function ProjectDetail(){
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  useEffect(()=>{ if(id){ axios.get(`${API}/projects/${id}`).then(r=>setData(r.data.project||r.data)).catch(()=>{}); } },[id]);
  if(!id) return null;
  if(!data) return <div>جارِ التحميل...</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <p className="text-gray-700">{data.description}</p>
      <div className="text-sm text-gray-500">الظهور: {data.visibility}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card h-40">صورة/فيديو</div>
        <div className="card h-40">وسوم/تقنيات</div>
      </div>
    </div>
  )
}
