import Link from 'next/link'

// ** MUI Components
import Box, { BoxProps } from '@mui/material/Box'
import MuiFormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel'
import { styled } from '@mui/material/styles'

const useLoginStyles = () => {
  // ** Styled Components
  const LoginIllustration = styled('img')(({ theme }) => ({
    zIndex: 2,
    maxHeight: 680,
    marginTop: theme.spacing(12),
    marginBottom: theme.spacing(12),
    [theme.breakpoints.down(1540)]: {
      maxHeight: 550
    },
    [theme.breakpoints.down('lg')]: {
      maxHeight: 500
    }
  }))

  const RightWrapper = styled(Box)<BoxProps>(({ theme }) => ({
    width: '100%',
    [theme.breakpoints.up('md')]: {
      maxWidth: 450
    },
    [theme.breakpoints.up('lg')]: {
      maxWidth: 600
    },
    [theme.breakpoints.up('xl')]: {
      maxWidth: 750
    }
  }))

  const LinkStyled = styled(Link)(({ theme }) => ({
    fontSize: '0.875rem',
    textDecoration: 'none',
    color: theme.palette.primary.main
  }))

  const FormControlLabel = styled(MuiFormControlLabel)<FormControlLabelProps>(({ theme }) => ({
    '& .MuiFormControlLabel-label': {
      fontSize: '0.875rem',
      color: theme.palette.text.secondary
    }
  }))

  return {
    LoginIllustration,
    RightWrapper,
    LinkStyled,
    FormControlLabel
  }
}

export default useLoginStyles
