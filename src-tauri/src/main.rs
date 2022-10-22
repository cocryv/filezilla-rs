#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::{net::TcpStream, io::Read, vec};
use serde::Serialize;
use ssh2::{Session, Sftp};
use tauri::{Size, LogicalSize, Manager};
use std::path::Path;
use std::{
    sync::{Mutex},
};
use tauri_plugin_positioner::{WindowExt, Position};
use directories::{UserDirs};

pub struct FtpState(Mutex<Ftp>);
pub struct Ftp {
  // stuff
  session: Option<Session>,
  sftp: Option<Sftp>
}

impl Ftp {
  pub fn get_files(&mut self,name: &str) {
    &self.sftp.as_ref().unwrap().readdir(Path::new(name)).unwrap();
  }
}

#[derive(Debug,Serialize,Clone)]
#[serde(rename_all = "camelCase")]
enum NotificationType {
    Info,
    Error
}

#[derive(Debug,Serialize,Clone)]
#[serde(rename_all = "camelCase")]
pub struct Notification{
    notification_type: NotificationType,
    message: String,
    connected: bool
}

#[derive(Debug,Serialize)]
#[serde(rename_all = "camelCase")]
struct File {
    name: String,
    size:  Option<u64>,
    isDir: bool
}

#[tauri::command]
fn connect(app: tauri::AppHandle,state: tauri::State<FtpState>,address:&str,host:&str,password:&str,port:&str) -> Result<String,String> {

    app.emit_all(
        "connection", 
        Notification{
            notification_type:NotificationType::Info,
            message: format!("Connection to {} ...",address),
            connected : false
        }
    ).unwrap();

    let tcm_request = TcpStream::connect(format!("{}:{}",address,port));
    let tcp = match tcm_request {
        Ok(tcp) => tcp,
        Err(e) => {
            app.emit_all(
                "connection", 
                Notification{
                    notification_type:NotificationType::Error,
                    message: format!("Error when trying to connect : {}",e),
                    connected : false
                }
            ).unwrap();
            return Err(e.to_string())
        },
    };

    let mut sess = Session::new().unwrap();


    sess.set_tcp_stream(tcp);
    sess.handshake().unwrap();
    let auth_request = sess.userauth_password(host, password);
    match auth_request {
        Ok(session) => {
            app.emit_all(
                "connection", 
                Notification{
                    notification_type:NotificationType::Info,
                    message: format!("Connection to {} successfull",address),
                    connected : true
                }
            ).unwrap();
            session
        },
        Err(e) => {
            app.emit_all(
                "connection", 
                Notification{
                    notification_type:NotificationType::Error,
                    message: String::from("Wrong credentials !"),
                    connected : false
                }
            ).unwrap();
            return Err(e.message().to_owned())},
    }

    let sftp_request = sess.sftp();

    let sftp = match sftp_request {
        Ok(file) => file,
        Err(e) => return Err(e.message().to_owned()),
    };


    let mut state_guard = state.0.lock().unwrap();
    state_guard.session = Some(sess);
    state_guard.sftp = Some(sftp);

    Ok(String::from("success"))
}

#[tauri::command]
fn search(app: tauri::AppHandle,state: tauri::State<FtpState>,name: &str) -> Result<Vec<File>,String> {


    let sftp = state.0.lock().expect("exit 3");
    let mut files: Vec<File> = vec![];

    let readdir_request = sftp.sftp.as_ref().unwrap().readdir(Path::new(name));
    let readdir = match readdir_request {
        Ok(readdir) => {
            readdir
        },
        Err(e) => {
            app.emit_all(
                "connection", 
                Notification{
                    notification_type:NotificationType::Error,
                    message: String::from(e.message()),
                    connected : false
                }
            ).unwrap();
            return Err(e.message().to_owned())},
    };

    for file in readdir.iter() {

        let size: Option<u64>;
        if file.1.is_file() {
            size = file.1.size;
        }else{
            size = None;
        }
        files.push(
            File { name: file.0.file_name().expect("exit 0").to_str().unwrap().to_owned(), size: size, isDir:file.1.is_dir() }
        )
    }
    Ok(files)
    
}

#[tauri::command]
fn download(app: tauri::AppHandle,state: tauri::State<FtpState>,file_name: &str) -> Result<String,String> {

    let sftp = state.0.lock().expect("exit 1");

    let (mut remote_file, stat) = sftp.session.as_ref().unwrap().scp_recv(Path::new(file_name)).unwrap();
    let mut contents = Vec::new();
    remote_file.read_to_end(&mut contents).unwrap();

    // Close the channel and wait for the whole content to be tranferred
    remote_file.send_eof().unwrap();
    remote_file.wait_eof().unwrap();
    remote_file.close().unwrap();
    remote_file.wait_close().unwrap();

    if let Some(user_dirs) = UserDirs::new() {
        let test = user_dirs.download_dir().unwrap().to_str().unwrap();
        let last = file_name.split('/').last().unwrap();

        std::fs::write(Path::new(&format!("{test}/{last}")), &contents).unwrap();

        app.emit_all(
            "connection", 
            Notification{
                notification_type:NotificationType::Info,
                message: format!("{last} has been added to your Download folder !"),
                connected : false
            }
        ).unwrap();

    }


    Ok("test".to_owned())
    
}

fn main() {
    tauri::Builder::default()
    .setup(|app| {
        let main_window = app.get_window("main").unwrap();
        println!("Initializing...");

        main_window
            .set_size(Size::Logical(LogicalSize {
                width: 1224.,
                height: 868.,
            }))
            .unwrap();
        main_window.set_resizable(true).unwrap();
      
        let _ = main_window.move_window(Position::TopLeft);
        main_window.open_devtools();
        println!("Done set size.");
        Ok(())
    })
        .manage(FtpState(Mutex::new(Ftp{session:None,sftp:None})))
        .invoke_handler(tauri::generate_handler![search,connect,download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}