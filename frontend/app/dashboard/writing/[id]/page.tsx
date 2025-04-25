'use client'

import apiService from "@/app/services/api";
import WritingInterface from "../components/WritingInterface";
import { Novel } from "@/app/services/types";
import { useEffect, useState, use } from "react";


export default function WritingPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    //获取ID为id的小说
    const [novel, setNovel] = useState<Novel>({
        id: '',
        title: '',
        description: '',
        chapters: [],
        user_id: '',
        is_top: false,
        is_archive: false,
        updated_at: '',
        created_at: ''
    })
    useEffect( () => {
       async function fetchData() {
        try{
            const res = await apiService.novels.getChapters(id)
            if(res){
                console.log(JSON.stringify(res))
                setNovel({...novel,chapters:res})
            }
        }catch(e){
        }
       }

       fetchData();
  
    },[id])
    return (
        <WritingInterface 
        setNovel={setNovel}
        novel={novel} />
    )
}
