"use client"
import React, { useState } from 'react'

const page = () => {
  const handleClick = () => {
    document.querySelector('h1').style.backgroundColor = 'lightblue';
  };
  return (
    <div className='flex flex-col items-center justify-center h-screen gap-6'>
      <h1 className='text-3xl font-bold bg-red-700 p-20'>Welcome to the Home Page</h1>
      <button 
        onClick={()=>{handleClick()}}
        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
        >
        Click Me
      </button>
    </div>
    
  )
}

export default page