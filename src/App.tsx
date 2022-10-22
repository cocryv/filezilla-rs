import { useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import Headers from "./components/Headers";
import "./App.css";
import LogBox from "./components/LogBox";
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuidv4 } from 'uuid';

export interface File {
  name: string;
  size: number;
  isDir: boolean;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("./");
  const [currentPath, setCurrentPath] = useState("./");
  const [fileList, setFileList] = useState<File[]>([]);
  const [connected, setConnected] = useState(false);


  async function search(dir: string) {
    let name = dir
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    const Files = (await invoke('search',{
      name
    })) as File[]

    setFileList(Files)
  }

  const changeConnectionState = (connectedVal: boolean) => {
    if(connected != connectedVal){
      setConnected(connectedVal);
      if(connectedVal == true){
        search('./');
      }else{
        setFileList([]);
      }
    }
  }
  const changeDirectory = (directory: string) => {
    setName(name+directory+'/');
    search(name+directory+'/');
  }
  const prevDir = () => {
    let split = name.split("/");
    let splicedStr = split.slice(0, split.length - 2).join("/") + "/";
    setName(splicedStr);
    search(splicedStr);
  }

  const download = async (file: string) => {
    let fileName = name+file;
    let response = await invoke('download',{
      fileName
    })
  }

return (
  <div>
    <Headers/>
    <LogBox prevDir={prevDir} setConnected={changeConnectionState}></LogBox>
    <div className=" w-4/5 h-96 mx-auto">
      { connected ?
        <div>
              <div className="mt-8">current directory : {name}</div>
             <table className="min-w-full divide-y divide-gray-200 overflow-scroll">
               <thead className="bg-gray-50">
                 <tr>
                  <th></th>
                 <th
                    scope="col"
                    className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase "
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase "
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase "
                  >
                    Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase "
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr onClick={prevDir} className='hover:bg-slate-100 cursor-pointer h-2'>
                  <td>
                  <span className="pl-6">..</span>
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                {fileList.map((file:File)=>(
                    <tr key={uuidv4()} onClick={()=>{file.isDir ? changeDirectory(file.name) : ''}} className={file.isDir ? ' hover:bg-slate-100 cursor-pointer h-2' : ''}>
                      <td className="text-center">
                      {file.isDir ? '>' : ''}
                      </td>
                    <td className="text-sm font-medium whitespace-nowrap text-center">
                      {file.name}
                    </td>
                    <td className="text-sm whitespace-nowrap text-center">
                      {file.isDir ? 'Directory' : 'File'}
                    </td>
                    <td className="text-sm whitespace-nowrap text-center">
                      {file.size}
                    </td>
                    <td onClick={()=>{download(file.name)}} className="text-center cursor-pointer">
                      {file.isDir ? '' : <FontAwesomeIcon icon={faDownload} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      : ''}
    </div>
  </div>
);
}

export default App;
