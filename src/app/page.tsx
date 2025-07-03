'use client';
import { use, useEffect, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css'
import { Socket, io } from "socket.io-client";

interface Accepted_data { from: string, to: string, board: number }
// const socketUrl = "ws://localhost:8900";
const socketUrl = "https://well-infrequent-replace.glitch.me";
let grid = new Array<string>();
export default function Home() {
  let sz = 3;
  const [myChar, setmyChar] = useState('O')
  const [hisChar, setHisChar] = useState('X')
  const [flg , setflg] = useState(1);
  const [waiting, setwaiting] = useState(true);
  const [G, setG] = useState<string[]>([]);
  
  // Socket connection state management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const socket = useRef<Socket | null>(null);
  const [randomid , setrand] = useState("");
  const [allusers , setallusers] = useState<string[]>([]);
  const [friendi, setfriend] = useState("");
  const [Accepted, setstate] = useState(false);
  const [counter, setcounter] = useState(0);
  const [timer, setTimer] = useState(30);
  
  /*****************************************************/
  const [request, setrequest] = useState("");
  const [requestmessage, setrequestmessage] = useState("");
  const [requestmessagefrom, setrequestmessagefrom] = useState("");
  const [requestsize, setrequestsize] = useState(3);
  /*****************************************************/
  const [winner, setwinner] = useState<string>(".");
  
  const [playing, setplaying] = useState(false);
  const [showNoUsers, setShowNoUsers] = useState(false);
  
  console.log(requestsize);
  
  const setSize = (n:number) => {
    sz = n;
    console.log(sz);
  }

  // Initialize socket connection
  const initializeSocket = () => {
    if (socket.current) {
      socket.current.disconnect();
    }

    socket.current = io(socketUrl, {
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection event handlers
    socket.current.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setConnectionError('');
      setIsReconnecting(false);
      setReconnectAttempts(0);
      
      // Generate new random ID only on successful connection
      if (!randomid) {
        let random_id = "";
        for(let i=0;i<10; ++i){
          random_id += `${Math.floor(Math.random() * 10)}`
        }
        setrand(random_id);
        socket.current?.emit("adduser", random_id);
      } else {
        // Re-add user with existing ID on reconnection
        socket.current?.emit("adduser", randomid);
      }
      
      socket.current?.emit("getallusers");
    });

    socket.current.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setConnectionError("Server disconnected. Please refresh the page.");
      }
    });

    socket.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    socket.current.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
    });

    socket.current.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setIsReconnecting(true);
      setReconnectAttempts(attemptNumber);
    });

    socket.current.on("reconnect_failed", () => {
      console.log("Reconnection failed");
      setIsReconnecting(false);
      setConnectionError("Failed to reconnect. Please refresh the page.");
    });

    // Game event handlers
    socket.current.on("winner" , (data) => {
      setwinner(data.player);
    });

    socket.current.on("update", (data) => {
      console.log(data);
      grid = data.G;
      update();
      setG(data.G);
      if(data.flg){
        setwaiting(false);
        setTimer((p) => 30)
      }
    });

    socket.current.on("responseallusers", (users:string[]) => {
      // Filter out current user to avoid duplicates
      const filteredUsers = users.filter(user => user !== randomid);
      setallusers(filteredUsers);
      setShowNoUsers(filteredUsers.length === 0);
    });

    socket.current.on("takeRequest", (user:any) => {
      console.log("request");
      setrequest(user[0])
      setrequestmessage(user[1])
      setrequestsize(user[2]);
      console.log(user[2]);
      sz = user[2];
    });

    socket.current.on("accepted", (data:Accepted_data) => {
      setmyChar('X');
      setHisChar('O');
      setfriend(data.from);
      setplaying(true);
      setSize(data.board)
      sz = data.board;
      build(sz);
      console.log(G);
      setwaiting(false);
      setplaying(true);
    });
  };

  // Manual reconnection function
  const handleReconnect = () => {
    initializeSocket();
  };

  // Refresh page function
  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    }
  }, []);

  // Update users list periodically when connected
  useEffect(() => {
    if (!isConnected || !socket.current) return;

    const interval = setInterval(() => {
      socket.current?.emit("getallusers");
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    const interval = setInterval(() => {
      if(!waiting)
        setTimer((p) => p - 1);
    }, 1000)

    return () => {
      clearInterval(interval);
    }
  }, [])

  const seder = (fid:string) => {
    if (!isConnected || !socket.current) {
      setConnectionError("Not connected to server. Please try reconnecting.");
      return;
    }
    
    console.log(sz);
    socket.current.emit("sendRequest", {
      from:randomid,
      to:fid,
      message:requestmessagefrom,
      board:requestsize
    });
  }

  const build = (boardsize:number) => {
    if(G.length){
      return;
    }
    let arr : string[]= [];
    
    for(let i=0;i<sz;i++){
      let s = "";
      for(let j=0;j<sz;++j){
        s += '.';
      }
      arr.push(s);
      grid.push(s);
    }

    setG(arr)
    console.log(G);
    setflg((prev) => prev + 1);
  }

  const Accept = () => {
    if (!isConnected || !socket.current) {
      setConnectionError("Not connected to server. Please try reconnecting.");
      return;
    }

    setfriend(request)
    sz = requestsize
    socket.current.emit("accept" , {
      from:randomid,
      to:request,
      board:sz
    })
    setfriend(request);
    setplaying(true);
    setwaiting(false);
    build(sz);
    console.log(G);
  }

  const Close = () => {
    setfriend("")
    setstate(false);
    setrequest("");
    setplaying(false);
  }

  const update = () => {
    setG(grid);
    setflg((prev) => prev + 1);
  } 

  const sen_to_play = (i:number, j:number) => {
    if (!isConnected || !socket.current) {
      setConnectionError("Not connected to server. Please try reconnecting.");
      return;
    }

    setwaiting(true);
    socket.current.emit("sendplay" , 
    {
      i:i,
      j:j,
      to:friendi,
      from:randomid,
      char:myChar
    })
  }

  const takeaction = (i:number, j:number) =>{
    if(waiting){
      return;
    }
    sen_to_play(j, i)
  }
  
  return (
    <div>
      <div className="container-fluid bg-dark text-light p-1">
        <h6>Your key: {randomid}</h6>
        <div className="d-flex align-items-center">
          <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-2`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isReconnecting && (
            <span className="badge bg-warning me-2">
              Reconnecting... (Attempt {reconnectAttempts})
            </span>
          )}
          {!isConnected && (
            <button className="btn btn-sm btn-outline-light me-2" onClick={handleReconnect}>
              Reconnect
            </button>
          )}
          <button className="btn btn-sm btn-outline-light" onClick={handleRefresh}>
            Refresh Page
          </button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Connection Error:</strong> {connectionError}
          <button type="button" className="btn-close" onClick={() => setConnectionError('')}></button>
        </div>
      )}

      {/* No Users Available Alert */}
      {showNoUsers && isConnected && !playing && (
        <div className="alert alert-info" role="alert">
          <strong>No other users online.</strong> Share your key with friends or wait for others to join.
        </div>
      )}

      {/* Winner Display */}
      {
        (winner != ".")?(
          <div className={`text-center ${winner=='X'? 'x-class' : 'o-class'}`}>
            <h1 className="display-1">{winner} {winner != "draw"?("wins"):""}</h1>
          </div>
        ):(
          ""
        )
      }

      {/* User List */}
      {
        (!Accepted && !playing && isConnected)?(
          <>
            {
              allusers.length > 0 ? (
                allusers.map((el, i) => {
                  return(
                    <div className="cont container-fluid " key={`user-${el}-${i}`}>
                        <div className="req">
                          <h6>{el} (user)</h6>
                          <button 
                            className="btn btn-dark" 
                            onClick={() => seder(el)}
                            disabled={!isConnected}
                          >
                            Request
                          </button>
                          <input 
                            placeholder=" Message" 
                            type="text" 
                            onChange={(e) => setrequestmessagefrom(e.target.value)} 
                          />
                          <input 
                            placeholder="board size" 
                            type="number" 
                            onChange={(e) => setrequestsize(Math.max(parseInt(e.target.value) || 3, 3))} 
                          />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center mt-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading users...</span>
                  </div>
                  <p className="mt-2">Looking for other players...</p>
                </div>
              )
            }
          </>
        ):(
          ""
        )
      }

      {/* Game Request */}
      {
        (request && !playing)?(
          <div className="request">
            <h4>Request from : {request}</h4>
            <h4>Request Message: {requestmessage} </h4>
            <h4>Board size: {requestsize} </h4>
            <div className="ctrl">
              <button className="btn btn-danger" onClick={() => Close()}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={() => Accept()}
                disabled={!isConnected}
              >
                Accept
              </button>
            </div>
          </div>
        ):(
          ""
        )
      }

      {/* Game Board */}
      {
        playing && winner=='.'?(
          <div className="board">
            {
              flg?(
                G.map((x, i) => {
                  return(
                    <div className="row" key={`btn-${i}-out`}>
                      {
                        x.split("").map((y, j) => {
                          let val = y
                          if(val == ".") val = " ";
                          return(
                            <button 
                              disabled={val != " " || !isConnected} 
                              onClick={() => {takeaction(j, i)}} 
                              className={`cell ${val == 'X' ? 'x-class':''} ${val == 'O' ? 'o-class' : ''}`} 
                              key={`btn-${i}-${j}-insider`}
                            >
                              {val}
                            </button>
                          )
                        })
                      }
                    </div>
                  )
                })
              ):(
                ""
              )
            }
          </div>
        ):(
          ""
        )
      }
    </div>
  )
}