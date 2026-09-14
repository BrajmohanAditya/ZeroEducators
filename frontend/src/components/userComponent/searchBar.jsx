import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetCourseHook, useGetAllPurchasedCourseHook } from '../../hooks/course.hook.js'

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const { data } = useGetCourseHook()
  const { data: purchasedData } = useGetAllPurchasedCourseHook()

  const allCourses = useMemo(() => {
    if (!data?.courses) return [];
    return [...data.courses].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" })
    );
  }, [data?.courses]);

  const filteredCourses = useMemo(() => {
    if (!searchInput.trim()) return allCourses
    const q = searchInput.toLowerCase().trim()
    return allCourses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    )
  }, [allCourses, searchInput])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCourse = (course) => {
    setIsOpen(false)
    const isPurchased = purchasedData?.purchasedCourse?.some(
      (pc) => pc._id === course._id
    )
    if (isPurchased) {
      navigate(`/SinglePurchasedCourse/${course._id}`)
    } else {
      navigate(`/singleCourse/${course._id}`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (filteredCourses.length > 0) {
      handleSelectCourse(filteredCourses[0])
    }
  }

  return (
    <div ref={dropdownRef} className='relative w-full max-w-2xl'>
      <form 
        onSubmit={handleSubmit} 
        className='w-full flex items-center gap-3 justify-center group'
      >
        <div className='relative flex-1'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0b5cb8] transition-colors duration-300' />

          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            type="text"
            placeholder='What do you want to learn today? (Click for all courses)'
            className='w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl
            hover:bg-white hover:border-slate-300 hover:shadow-sm
            focus:bg-white focus:border-[#0b5cb8] focus:ring-4 focus:ring-[#0b5cb8]/20 focus:outline-none
            transition-all duration-300 text-[15px] placeholder-slate-400 text-[#050e08] font-medium shadow-sm'
          />

          {searchInput && (
            <button
              type='button'
              onClick={() => {
                setSearchInput('')
              }}
              className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 
              hover:bg-slate-100 rounded-lg transition-colors duration-200 group/close cursor-pointer'
            >
              <X className='w-4 h-4 text-slate-400 group-hover/close:text-slate-600' />
            </button>
          )}
        </div>

        <button
          type='submit'
          className='px-6 py-3 bg-gradient-to-r from-[#073b75] via-[#0b5cb8] to-[#1565c0] 
          hover:from-[#09488f] hover:to-[#1e88e5] text-white font-extrabold uppercase rounded-xl 
          shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 
          transition-all duration-300 text-sm tracking-wider cursor-pointer shrink-0'
        >
          Search
        </button>
      </form>

      {/* Dropdown list of courses */}
      {isOpen && (
        <div className='absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
              {searchInput.trim()
                ? `Matching Courses (${filteredCourses.length})`
                : `All Available Courses (${allCourses.length})`}
            </span>
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className='text-[11px] font-bold text-[#0b5cb8] hover:underline cursor-pointer'
              >
                Show all
              </button>
            )}
          </div>

          <div className='max-h-80 overflow-y-auto divide-y divide-slate-100 text-left'>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const isPurchased = purchasedData?.purchasedCourse?.some(
                  (pc) => pc._id === course._id
                )
                return (
                  <div
                    key={course._id}
                    onClick={() => handleSelectCourse(course)}
                    className='p-3 flex items-center gap-3 hover:bg-blue-50/70 transition cursor-pointer group'
                  >
                    <div className='w-14 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200'>
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <h4 className='text-xs font-bold text-slate-900 truncate group-hover:text-[#0b5cb8]'>
                          {course.title}
                        </h4>
                        {isPurchased && (
                          <span className='text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-full shrink-0'>
                            Enrolled
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-2 text-[11px] text-slate-500 mt-0.5'>
                        <span>{course.duration || '12 hrs'}</span>
                        <span>•</span>
                        <span className='font-bold text-slate-900'>
                          {course.isFree || Number(course.amount) === 0
                            ? 'FREE'
                            : `₹${course.amount}`}
                        </span>
                      </div>
                    </div>

                    <span className='text-xs font-bold text-[#0b5cb8] group-hover:translate-x-0.5 transition-transform shrink-0'>
                      {isPurchased ? 'Continue →' : 'Enroll →'}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className='p-6 text-center text-slate-500'>
                <BookOpen className='w-8 h-8 text-slate-300 mx-auto mb-2' />
                <p className='text-xs font-bold text-slate-700'>
                  No courses found matching "{searchInput}"
                </p>
                <p className='text-[11px] text-slate-400 mt-0.5'>
                  Try checking the spelling or view all courses
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
