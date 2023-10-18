export function generator():string{
    let str:string ="";
    for(let i=0;i<10;i++)
      str += `${Math.floor(Math.random()*10)}`
    
    return str;
}
