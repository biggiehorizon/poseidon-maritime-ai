import { render, screen, fireEvent } from '@testing-library/react'
import RouteForm from '../RouteForm'

test('renders origin and destination inputs', () => {
  render(<RouteForm onSubmit={vi.fn()} />)
  expect(screen.getByLabelText(/origin lat/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/destination lat/i)).toBeInTheDocument()
})

test('calls onSubmit with route data', () => {
  const onSubmit = vi.fn()
  render(<RouteForm onSubmit={onSubmit} />)
  fireEvent.change(screen.getByLabelText(/origin lat/i), { target: { value: '37.8' } })
  fireEvent.change(screen.getByLabelText(/origin lon/i), { target: { value: '-122.4' } })
  fireEvent.change(screen.getByLabelText(/destination lat/i), { target: { value: '36.6' } })
  fireEvent.change(screen.getByLabelText(/destination lon/i), { target: { value: '-121.9' } })
  fireEvent.click(screen.getByRole('button', { name: /get forecast/i }))
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    origin_lat: 37.8, dest_lat: 36.6
  }))
})
