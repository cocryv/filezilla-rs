import React, { useState, useRef, LegacyRef } from 'react'
import { invoke } from "@tauri-apps/api/tauri";
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Headers() {
    const [state, setState] = useState({ loading: false });
    const [address, setAddress] = useState<string>("");
    const [host, setHost] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [port, setPort] = useState<string>("");

    const submitForm = async () => {
        setState({ ...state, loading: true });
        let response = await invoke('connect',{
            address,host,password,port
        })
        setState({ ...state, loading: false });
    }

  return (
    <div className='flex justify-between items-center mt-10'>
        <a href="https://tauri.app" target="_blank">
            <img src="/logo.png" className="logo tauri h-14 ml-4" alt="Tauri logo" />
        </a>
        <div className='flex gap-8'>
            {/* 4 input & 1 btn */}
            <div className='flex gap-8'>
                {/* 4 input */}
                <input value={address} onChange={e => setAddress(e.target.value)} className=' bg-slate-50 p-2 rounded-xl shadow-md text-center h-8' type="text" id="address" placeholder='address'/>
                <input value={host} onChange={e => setHost(e.target.value)} className=' bg-slate-50 p-2 rounded-xl shadow-md text-center h-8' type="text" id="host" placeholder='host'/>
                <input value={password} onChange={e => setPassword(e.target.value)} className=' bg-slate-50 p-2 rounded-xl shadow-md text-center h-8' type="password" id="password" placeholder='password'/>
                <input value={port} onChange={e => setPort(e.target.value)} className=' bg-slate-50 p-2 rounded-xl shadow-md text-center h-8' type="text" id="port" placeholder='port'/>
            </div>
            {/* 1 btn */}
            <div onClick={submitForm} className='bg-slate-50 p-2 rounded-xl shadow-md flex gap-2 h-8'>
                <div className=' text-green-500'>●</div>
                <div className=' font-medium'>log in</div>
            </div>
        </div>
            <FontAwesomeIcon icon={faQuestionCircle} />
        <div>
        </div>
    </div>
  )
}
