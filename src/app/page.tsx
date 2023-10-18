'use client';
import { use, useEffect, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css'
import { Socket, io } from "socket.io-client";

interface Accepted_data { from: string, to: string, board: number }

let grid = new Array<string>();
export default function Home() {
  let sz = 3;
  const [myChar, setmyChar] = useState('O')
  const [hisChar, setHisChar] = useState('X')
  const [flg , setflg] = useState(1);
  const [waiting, setwaiting] = useState(true);
  const [G, setG] = useState<string[]>([]);
  const socket = useRef(io("ws://localhost:8900"))
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
  console.log(requestsize);
  
  const setSize = (n:number) => {
    sz = n;
    console.log(sz);
    
  }

  useEffect(() => {
    
    if(randomid != "") return;
    let random_id = "";
    for(let i=0;i<10; ++i){
      random_id += `${Math.floor(Math.random() * 10)}`
    }

    setrand(random_id);
    socket.current.emit("adduser", random_id); // call the function "addUser"
    socket.current.emit("getallusers"); // call the function "getallusers"
  }, [])

  useEffect(() => {
    socket.current.on("winner" , (data) => {
      setwinner(data.player);
    })
    socket.current.on("update", (data) => {
      console.log(data);
      grid = data.G;
      update();
      setG(data.G);
      if(data.flg){
        setwaiting(false);
        setTimer((p) => 30)
      }
    })

    socket.current.on("responseallusers", (users:string[]) => {
      setallusers(users);
    })

    socket.current.on("takeRequest", (user:any) => {
      console.log("request");
      setrequest(user[0])
      setrequestmessage(user[1])
      setrequestsize(user[2]);
      console.log(user[2]);
      
      sz = user[2];
    }) 


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
      
    })
    
  }, [socket]);

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
    setwaiting(true);

    socket.current.emit("sendplay" , 
    {
      i:i,
      j:j,
      to:friendi,
      from:randomid,
      char:myChar
    }
    )
  }

  const takeaction = (i:number, j:number) =>{
    if(waiting){
      return;
    }
    // update();
    sen_to_play(j, i)
  }
  
  return (
    <div>
     <div className="container-fluid bg-dark text-light p-1">
     <h6>Your key: {randomid}</h6>



     </div>

     {
      (winner != ".")?(
        <div className={`text-center ${winner=='X'? 'x-class' : 'o-class'}`}>
          <h1 className="display-1">{winner} {winner != "draw"?("wins"):""}</h1>
        </div>
      ):(
        ""
      )
     }
      {
        (!Accepted && !playing)?(
          <>
            {
              allusers.map((el, i) => {
                if(el != randomid){
                  return(
                    <div className="cont container-fluid " key={`-${i}-`}>
                        <div key={i} className="req">
                          <h6>{el} (user)</h6>
                          <button className="btn btn-dark" onClick={() => seder(el)}>Request</button>
                          <input placeholder=" Message" type="text" onChange={(e) => setrequestmessagefrom(e.target.value)} />
                          <input placeholder="board size" type="number" onChange={(e) => setrequestsize(Math.max(parseInt(e.target.value), 3))} />
                      </div>
                    </div>
                  )
                }
                
              })
            }
          </>
        ):(
          ""
        )
      }

      {
        (request && !playing)?(
          <div className="request">
            
            <h4>Request from : {request}</h4>
            <h4>Request Message: {requestmessage} </h4>
            <h4>Board size: {requestsize} </h4>
            <div className="ctrl">
              <button className="btn btn-danger" onClick={() => Close()}>cancel</button>
              <button className="btn btn-success" onClick={() => Accept()}>Accept</button>
            </div>
          </div>
        ):(
          ""
        )
      }

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
                              <button disabled={val != " "} onClick={() => {takeaction(j, i)}} className={`cell ${val == 'X' ? 'x-class':''} ${val == 'O' ? 'o-class' : ''}`} key={`btn-${i+j}-insider`}>
                                {
                                  val
                                }
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
