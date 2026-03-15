// ** MUI Imports
import { CircularProgress } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import { memo } from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

type Props = {
  handleDelete: (bol: boolean) => void
  submitBtnDisableFlag: boolean
  text?: string
}

const DeleteDialog = (props: Props) => {
  // ** Props
  const { handleDelete, submitBtnDisableFlag } = props

  // ** Handle

  return (
    <>
      <Dialog
        fullWidth
        open={true}
        onClose={() => handleDelete(false)}
        sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 512 } }}
      >
        <DialogContent
          sx={{
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Box
            sx={{
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              '& svg': { mb: 8, color: 'warning.main' }
            }}
          >
            <Icon icon='tabler:alert-circle' fontSize='5.5rem' />
            <Typography variant='h4' sx={{ mb: 5, color: 'text.secondary' }}>
              Are you sure?
            </Typography>
            <Typography>Please note that this action is irreversible.</Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='contained' sx={{ mr: 2 }} disabled={submitBtnDisableFlag} onClick={() => handleDelete(true)}>
            {submitBtnDisableFlag && <CircularProgress size={10} sx={{ mr: 3 }}></CircularProgress>}
            Delete
          </Button>
          <Button variant='outlined' color='primary' onClick={() => handleDelete(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default memo(DeleteDialog)
