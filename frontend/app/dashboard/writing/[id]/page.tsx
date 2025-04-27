'use client'

import apiService from "@/app/services/api";
import WritingInterface from "../components/WritingInterface";
import { Chapter, Novel } from "@/app/services/types";
import { useEffect, useState, use } from "react";


export default function WritingPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    //获取ID为id的小说
    const [novel, setNovel] = useState<Novel | null>(null)
    useEffect( () => {
       async function fetchData() {
        try{
            const res = await apiService.novels.getChapters(id)

            if(res){
                setNovel(res as unknown as Novel)
            }
        }catch(e){
        }
       }
      fetchData();
  
    },[id])
    return (
        <WritingInterface 
        setNovel={setNovel}
        novel={novel as Novel} />
    )
}
