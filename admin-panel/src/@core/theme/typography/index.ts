// ** Theme Type Import
import { Theme } from '@mui/material/styles'

const Typography = (theme: Theme) => {
  return {
    h1: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    h2: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    h3: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    h4: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    h5: {
      fontWeight: 500,
      color: theme.palette.text.primary
    },
    h6: {
      color: theme.palette.text.primary
    },
    subtitle1: {
      color: theme.palette.text.primary
    },
    subtitle2: {
      color: theme.palette.text.secondary
    },
    body1: {
      color: theme.palette.text.primary,
      '@media (min-width: 1024px) and (max-width: 1920px)': {
        fontSize: 14, // Set font size to 14px for targeted screens
      }
    },
    body2: {
      color: theme.palette.text.secondary
    },
    button: {
      color: theme.palette.text.primary
    },
    caption: {
      color: theme.palette.text.secondary
    },
    overline: {
      color: theme.palette.text.secondary
    }
  }
}

export default Typography
