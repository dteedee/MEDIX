import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />)
    
    const spinner = container.querySelector('div')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-6', 'h-6', 'animate-spin')
  })

  it('renders with different sizes', () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />)
    expect(container.querySelector('div')).toHaveClass('w-4', 'h-4')

    rerender(<LoadingSpinner size="lg" />)
    expect(container.querySelector('div')).toHaveClass('w-8', 'h-8')

    rerender(<LoadingSpinner size="xl" />)
    expect(container.querySelector('div')).toHaveClass('w-12', 'h-12')
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    
    const spinner = container.querySelector('div')
    expect(spinner).toHaveClass('custom-class')
  })

  it('renders SVG with correct attributes', () => {
    const { container } = render(<LoadingSpinner />)
    
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    expect(svg).toHaveAttribute('fill', 'none')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  it('contains circle and path elements', () => {
    const { container } = render(<LoadingSpinner />)
    
    const svg = container.querySelector('svg')
    const circle = svg?.querySelector('circle')
    const path = svg?.querySelector('path')
    
    expect(circle).toBeInTheDocument()
    expect(path).toBeInTheDocument()
    expect(circle).toHaveClass('opacity-25')
    expect(path).toHaveClass('opacity-75')
  })
})

describe('PageLoader Component', () => {
  it('renders loading spinner and text', () => {
    const { container } = render(<PageLoader />)
    
    expect(screen.getByText('Đang tải...')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('has correct layout classes', () => {
    const { container } = render(<PageLoader />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'min-h-screen', 'space-y-4')
  })

  it('renders large spinner with blue color', () => {
    const { container } = render(<PageLoader />)
    
    const spinner = container.querySelector('div')
    expect(spinner).toHaveClass('w-12', 'h-12', 'text-blue-600')
  })
})
