import { render, screen, fireEvent } from '@testing-library/react'
import PoseidonChat from '../PoseidonChat'

const mockOnSend = vi.fn()

test('renders chat input', () => {
  render(<PoseidonChat vesselId="abc" route={null} onForecastUpdate={vi.fn()} messages={[]} onSend={mockOnSend} />)
  expect(screen.getByPlaceholderText(/ask poseidon/i)).toBeInTheDocument()
})

test('displays user and poseidon messages', () => {
  const messages = [
    { role: 'user' as const, content: 'What is the forecast?' },
    { role: 'poseidon' as const, content: 'The Pacific is cooperative today.' },
  ]
  render(<PoseidonChat vesselId="abc" route={null} onForecastUpdate={vi.fn()} messages={messages} onSend={mockOnSend} />)
  expect(screen.getByText('What is the forecast?')).toBeInTheDocument()
  expect(screen.getByText('The Pacific is cooperative today.')).toBeInTheDocument()
})

test('send button is disabled when input is empty', () => {
  render(<PoseidonChat vesselId="abc" route={null} onForecastUpdate={vi.fn()} messages={[]} onSend={mockOnSend} />)
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
})

test('calls onSend when form submitted with text', async () => {
  const onSend = vi.fn()
  render(<PoseidonChat vesselId="abc" route={null} onForecastUpdate={vi.fn()} messages={[]} onSend={onSend} />)
  fireEvent.change(screen.getByPlaceholderText(/ask poseidon/i), { target: { value: 'Will it be rough?' } })
  fireEvent.click(screen.getByRole('button', { name: /send/i }))
  expect(onSend).toHaveBeenCalledWith('Will it be rough?')
})
