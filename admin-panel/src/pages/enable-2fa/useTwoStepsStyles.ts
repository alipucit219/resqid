import Box, { BoxProps } from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Cleave from 'cleave.js/react'
import Link from 'next/link'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

const useTwostepsStyles = () => {
  const theme = useTheme()

  // ** Styled Components
  const TwoStepsIllustration = styled('img')(({ theme }) => ({
    zIndex: 2,
    maxHeight: 650,
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
    fontSize: '1rem',
    textDecoration: 'none',
    marginLeft: theme.spacing(2),
    color: theme.palette.primary.main
  }))

  const CleaveInput = styled(Cleave)(({ theme }) => ({
    maxWidth: 48,
    textAlign: 'center',
    height: '48px !important',
    fontSize: '150% !important',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '&:not(:last-child)': {
      marginRight: theme.spacing(2)
    },
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      margin: 0,
      WebkitAppearance: 'none'
    }
  }))

  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  return {
    TwoStepsIllustration,
    RightWrapper,
    LinkStyled,
    CleaveInput,
    hidden,
    theme
  }
}

export default useTwostepsStyles
