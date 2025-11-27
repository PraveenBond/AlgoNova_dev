import React, { useState, useEffect } from 'react'
import './DigitalClock.css'

const DigitalClock: React.FC = () => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => {
            clearInterval(timer)
        }
    }, [])

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <div className="digital-clock">
            <div className="time">{formatTime(time)}</div>
            <div className="date">{formatDate(time)}</div>
        </div>
    )
}

export default DigitalClock
