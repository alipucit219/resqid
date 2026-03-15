// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

interface ICustomDeleteConfirmationDialogProps {
  handleDelete: (flag: boolean) => void
}

const CustomDeleteConfirmationDialog = ({ handleDelete }: ICustomDeleteConfirmationDialogProps) => {
  return (
    <Fragment>
      <Dialog
        open={true}
        disableEscapeKeyDown
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleDelete(false)
          }
        }}
      >
        <DialogTitle id='alert-dialog-title'>Are you sure to delete this item?</DialogTitle>
        <DialogContent>
          {/* <DialogContentText id='alert-dialog-description'>
            Let Google help apps determine location. This means sending anonymous location data to Google, even when no
            apps are running.
          </DialogContentText> */}
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={() => handleDelete(false)}>Cancel</Button>
          <Button onClick={() => handleDelete(true)}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default CustomDeleteConfirmationDialog
