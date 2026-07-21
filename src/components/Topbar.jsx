import React from 'react'
import { ArrowUpRight, Play } from 'lucide-react'

export function Topbar() {
  return (
    <header className="topbar">
      <a className="brand" href="#">
        <span className="brand-mark">
          <Play size={12} fill="currentColor" />
        </span>
        <span>framefinder</span>
      </a>
      <div className="top-status">
        <i /> Frontend-only <span>v2.0</span>
      </div>
      <a className="how-link" href="#workflow">
        Jak to działa <ArrowUpRight size={14} />
      </a>
    </header>
  )
}
