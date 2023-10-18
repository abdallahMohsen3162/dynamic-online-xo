import React from 'react'

export default function Row(row:string) {
    let arr = row.split("");
return (
    <div className='row'>
        {
            arr.map((el, idx) => {
                return(
                    <div>
                        {el}
                    </div>
                )
            })
        }
    </div>
  )
}
