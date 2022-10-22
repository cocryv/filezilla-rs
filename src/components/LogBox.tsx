import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import { invoke } from '@tauri-apps/api';

export interface Notification {
    notificationType: string;
    message: string;
    connected: boolean;
  }


export default function LogBox(props: any ) {

    const [notificationList, setNotificationList] = useState<Notification[]>([]);
    const [fileList, setFileList] = useState<File[]>([]);
    const [name, setName] = useState("./");
    const ref = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        async function listento() {
            listen('connection', event => {
                const notification = event.payload as Notification;
                setNotificationList(notificationList => [...notificationList, event.payload as Notification])
                if(notification.connected){
                    props.setConnected(true);
                }else{
                    props.setConnected(false);
                }
                const objDiv = document.getElementById('logbox');
                objDiv!.scrollTop = objDiv!.scrollHeight + 200;
                if(notification.message=="permission denied"){
                    props.prevDir();
                }
            })
            listen('file', file => {
            })
        }
        listento();
    }, []);

    async function search() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        const Files = (await invoke('search',{
          name
        })) as File[]
    
        setFileList(Files)
    
      }
    
  return (
    <div id='logbox' ref={ref} onClick={search} className='bg-slate-50 p-2 rounded-xl shadow-md mt-8 w-3/4 h-32 mx-auto overflow-scroll'>
        {notificationList.map((notification:Notification)=>(
            <div className='flex gap-8' key={uuidv4()}>
                <span>{notification.notificationType}</span>
                <span className={notification.notificationType == 'error' ? 'text-red-600' : ''}>{notification.message}</span>
            </div>
        ))}
    </div>
  )
}
