import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = searchInput.trim()
    if (!query) {
      if (location.pathname === '/') {
        const el = document.getElementById('courses')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      } else {
        navigate('/#courses')
      }
      return
    }

    if (location.pathname === '/') {
      navigate(`/?search=${encodeURIComponent(query)}#courses`)
      const el = document.getElementById('courses')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/?search=${encodeURIComponent(query)}#courses`)
    }
  }

  return (
    <div className='relative w-full max-w-2xl'>
      <form 
        onSubmit={handleSubmit} 
        className='w-full flex items-center gap-2 sm:gap-3 justify-center group'
      >
        <div className='relative flex-1'>
          <Search className='absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0b5cb8] transition-colors duration-300' />

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            type="text"
            placeholder='Search courses, exams...'
            className='w-full pl-9 sm:pl-11 pr-9 sm:pr-11 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl
            hover:bg-white hover:border-slate-300 hover:shadow-xs
            focus:bg-white focus:border-[#0b5cb8] focus:ring-4 focus:ring-[#0b5cb8]/15 focus:outline-none
            transition-all duration-300 text-xs sm:text-sm placeholder-slate-400 text-[#050e08] font-medium shadow-xs'
          />

          {searchInput && (
            <button
              type='button'
              onClick={() => setSearchInput('')}
              className='absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 
              hover:bg-slate-100 rounded-lg transition-colors duration-200 group/close cursor-pointer'
              title='Clear search'
            >
              <X className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover/close:text-slate-600' />
            </button>
          )}
        </div>

        <button
          type='submit'
          className='px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#073b75] via-[#0b5cb8] to-[#1565c0] 
          hover:from-[#09488f] hover:to-[#1e88e5] text-white font-extrabold uppercase rounded-xl 
          shadow-xs hover:shadow-sm active:scale-95 
          transition-all duration-200 text-xs sm:text-xs tracking-wider cursor-pointer shrink-0'
        >
          Search
        </button>
      </form>
    </div>
  )
}

export default SearchBar

