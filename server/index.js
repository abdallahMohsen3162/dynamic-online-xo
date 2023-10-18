

const io = require("socket.io")(8900, {
    cors:{
        origin:"http://localhost:3000"
    }
})    
    
let mp = new Map()  
let st = new Set(); 
let G = [];

 
 

io.on("connection", (socket) => {
    socket.on("adduser" , random_id => { 
        st.add(socket.id)
        if(mp.size > 3){
            mp.clear();
        }
        mp.set(random_id, socket.id); 
    })  
  
    socket.on("sendRequest", data => {
        console.log(data);
        io.to(mp.get(data.to)).emit("takeRequest", [data.from, data.message, data.board])
    })    
  
    socket.on("getallusers", () => { 
        let arr  = []; 
        for(let[a , b] of mp){
            arr.push(a);
        }
        io.emit("responseallusers", arr)
    })  
  
    socket.on("accept" , (data) => {
        G = [];
        console.log(data);
        for(let i=0;i<data.board;i++){
            G[i] = "";
            for(let j=0;j<data.board;j++){
                G[i] += '.';
            }
        }
        console.log(G);
        io.to(mp.get(data.to)).emit("accepted", data)
    }) 


    function validation(){
        let draw = true;
        for(let i=0;i<G.length;i++){
            for(let j=0;j<G[i].length;j++){
                if(G[i][j] == '.'){
                    draw = false;
                }
                let str = "";
                if(i + 2 < G.length){
                    str += G[i][j];
                    str += G[i+1][j];
                    str += G[i+2][j];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }
    
                str = "";
                if(i - 2 >= 0){
                    str += G[i][j];
                    str += G[i-1][j];
                    str += G[i-2][j];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }
                str = "";
                if(j + 2 < G.length){
                    str += G[i][j];
                    str += G[i][j+1];
                    str += G[i][j+2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }
    
                str = "";
                if(j - 2 >= 0){
                    str += G[i][j];
                    str += G[i][j-1];
                    str += G[i][j-2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }

                str = "";
                if(i + 2 < G.length && j + 2 < G.length){
                    str += G[i][j];
                    str += G[i+1][j+1];
                    str += G[i+2][j+2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }

                str = "";
                if(i - 2 >= 0 && j - 2 >= 0){
                    str += G[i][j];
                    str += G[i-1][j-1];
                    str += G[i-2][j-2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }

                str = "";
                if(i - 2 >= 0 && j + 2 < G.length){
                    str += G[i][j];
                    str += G[i-1][j+1];
                    str += G[i-2][j+2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }


                str = "";
                if(i + 2 < G.length && j - 2 >= 0){
                    str += G[i][j];
                    str += G[i+1][j-1];
                    str += G[i+2][j-2];
                    if(str == "XXX" || str == "OOO"){
                        return str[0];
                    }
                }
                
            }
        }
        if(draw == true){
            return "draw"
        }
        return '.';
    }
 
    socket.on("sendplay", (data) => {
        console.log(data);
        let s="";
        for(let j=0;j<G[data.i].length;j++){
            if(j == data.j){
                s += data.char;
            }else{
                s += G[data.i][j];
            }
            
        }
        G[data.i] = s; 
        let ret = validation()
        if(ret != '.'){
            io.to(mp.get(data.to)).emit("winner", {player:ret});
            io.to(mp.get(data.from)).emit("winner", {player:ret});
        }
        io.to(mp.get(data.to)).emit("update", {G:G, flg:true});
        io.to(mp.get(data.from)).emit("update", {G:G,flg:false});
    }) 
    socket.on("disconnect", () => {
        console.log(socket.id); // undefined
    });
})  

