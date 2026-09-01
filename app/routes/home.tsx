import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import { resumes } from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream Job!" },
  ];
}

export default function Home() {
  const { kv, auth, fs,  isLoading} = usePuterStore()
  const navigate = useNavigate()

  const[ resumes, setResumes] = useState<Resume[]>([])
  const [loadigResumes, setLoadingResumes] = useState(false)

  useEffect(() => {
    if(!auth.isAuthenticated && !isLoading) navigate('/auth?next=/');
  }, [auth.isAuthenticated, isLoading])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      
      const parsedResumes = resumes?.map((resume) =>  
        JSON.parse(resume.value) as Resume
      )

      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes()
  }, []);


  return (
    <main className="bg-cover bg-[url('/images/bg-main.svg')] ">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track your Application & Resume Rating</h1>
          <h2>Review your submissions and check AI-Powerd feedback. </h2>
        </div>

      {!loadigResumes && resumes.length > 0 && (
        <div className="resumes-section">
      {resumes.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} />
      ))}
      </div>
    )}
    </section>
  </main>
  ) 
}