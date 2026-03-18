import { render, screen, fireEvent } from '@testing-library/react'
import VesselSetup from '../VesselSetup'

test('renders vessel name input', () => {
  render(<VesselSetup onSave={vi.fn()} />)
  expect(screen.getByLabelText(/vessel name/i)).toBeInTheDocument()
})

test('calls onSave with vessel data when form is submitted', async () => {
  const onSave = vi.fn()
  render(<VesselSetup onSave={onSave} />)
  fireEvent.change(screen.getByLabelText(/vessel name/i), { target: { value: 'Sea Witch' } })
  fireEvent.change(screen.getByLabelText(/vessel type/i), { target: { value: 'monohull sailboat' } })
  fireEvent.change(screen.getByLabelText(/length/i), { target: { value: '36' } })
  fireEvent.change(screen.getByLabelText(/draft/i), { target: { value: '5.75' } })
  fireEvent.click(screen.getByRole('button', { name: /save vessel/i }))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sea Witch' }))
})

test('does not call onSave when name is empty', () => {
  const onSave = vi.fn()
  render(<VesselSetup onSave={onSave} />)
  fireEvent.click(screen.getByRole('button', { name: /save vessel/i }))
  expect(onSave).not.toHaveBeenCalled()
})
