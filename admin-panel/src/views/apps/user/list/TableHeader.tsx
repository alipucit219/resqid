// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { WithAuthorization } from 'src/HOCs/with-authorization'

interface TableHeaderProps {
  value: string
  toggle: () => void
  handleFilter: (val: string) => void
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, toggle, value } = props

  return (
    <Box
      sx={{
        py: 4,
        px: 6,
        rowGap: 2,
        columnGap: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <TextField
        size='small'
        value={value}
        sx={{ minWidth: { xs: '100%', sm: 280 }, mr: { xs: 0, sm: 2 } }}
        placeholder='Search User'
        onChange={e => handleFilter(e.target.value)}
      />
      {WithAuthorization({
        component:
          <Button onClick={toggle} variant='contained' sx={{ '& svg': { mr: 2 }, ml: { xs: 0, sm: 'auto' } }}>
            <Icon fontSize='1.125rem' icon='tabler:plus' />
            Add New User
          </Button>,
        requiredPermission: "CREATE_USER"
      })}
    </Box>
  )
}

export default TableHeader
