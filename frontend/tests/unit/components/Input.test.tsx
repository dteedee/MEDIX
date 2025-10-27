import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input, TextArea } from '@/components/ui/Input'

describe('Input Component', () => {
  it('renders input with label', () => {
    render(<Input label="Email" placeholder="Enter email" />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument()
  })

  it('renders input without label', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument()
  })

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Email" error="Email is required" />)
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
  })

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="Enter your email address" />)
    
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
  })

  it('does not show helper text when error is present', () => {
    render(
      <Input 
        label="Email" 
        error="Email is required" 
        helperText="Enter your email address" 
      />
    )
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.queryByText(/enter your email address/i)).not.toBeInTheDocument()
  })

  it('handles input change', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test@example.com' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('test@example.com')
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" />)
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('forwards other props', () => {
    render(<Input data-testid="test-input" type="email" />)
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('type', 'email')
  })
})

describe('TextArea Component', () => {
  it('renders textarea with label', () => {
    render(<TextArea label="Message" placeholder="Enter message" />)
    
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter message/i)).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TextArea label="Message" error="Message is required" />)
    
    expect(screen.getByText(/message is required/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
  })

  it('handles textarea change', () => {
    const handleChange = vi.fn()
    render(<TextArea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue('Hello world')
  })
})

