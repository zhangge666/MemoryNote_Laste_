// 浏览器兼容的EventEmitter实现
export class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
    return this
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper)
      listener.apply(this, args)
    }
    return this.on(event, onceWrapper)
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event)
    if (!listeners) return false
    
    listeners.forEach(listener => {
      try {
        listener.apply(this, args)
      } catch (error) {
        console.error('EventEmitter error:', error)
      }
    })
    return true
  }

  removeListener(event: string, listener: Function): this {
    const listeners = this.events.get(event)
    if (!listeners) return this
    
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
    
    if (listeners.length === 0) {
      this.events.delete(event)
    }
    return this
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
    return this
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0
  }

  eventNames(): string[] {
    return Array.from(this.events.keys())
  }
}

