import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom' // Agar aap react-router use kar rahe hain

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      console.log("Searching for:", searchInput)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className='w-full max-w-2xl flex items-center gap-3 justify-center group'
    >
      <div className='relative flex-1'>
        <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#d4af37] transition-colors duration-300' />

        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          type="text"
          placeholder='What do you want to learn today?'
          className='w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl
          hover:bg-white hover:border-slate-300 hover:shadow-sm
          focus:bg-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/20 focus:outline-none
          transition-all duration-300 text-[15px] placeholder-slate-400 text-[#050e08] font-medium shadow-sm'
        />

        {searchInput && (
          <button
            type='button'
            onClick={() => setSearchInput('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 
            hover:bg-slate-100 rounded-lg transition-colors duration-200 group/close'
          >
            <X className='w-4 h-4 text-slate-400 group-hover/close:text-slate-600' />
          </button>
        )}
      </div>

      {/* Agar Navbar me ye button thoda bada lage, toh aap iska size chota kar sakte hain */}
      <button
        type='submit'
        className='px-6 py-3 bg-[#050e08] text-[#d4af37] font-extrabold uppercase rounded-xl shadow-sm hover:shadow-md 
        hover:-translate-y-0.5 hover:bg-[#0a1e11] border border-[#d4af37]/30
        active:translate-y-0 transition-all duration-300 text-sm tracking-wider'
      >
        Search
      </button>
    </form>
  )
}

export default SearchBar
