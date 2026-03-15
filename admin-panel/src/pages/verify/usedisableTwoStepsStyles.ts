import MuiCard, { CardProps } from '@mui/material/Card'
import Link from 'next/link'
import Cleave from 'cleave.js/react'
import { styled, useTheme } from '@mui/material/styles'

const useDisabledStyles = () => {
  const theme = useTheme()

  const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
    [theme.breakpoints.up('sm')]: { width: '25rem' }
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

  return {
    LinkStyled,
    Card,
    CleaveInput,
    theme
  }
}

export default useDisabledStyles
