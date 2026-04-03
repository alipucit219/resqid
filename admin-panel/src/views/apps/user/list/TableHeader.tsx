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
        justifyContent: 'flex-start'
      }}
    >
      {/* <Button color='secondary' variant='outlined' startIcon={<Icon icon='tabler:upload' />}>
        Export
      </Button> */}
      <Box sx={{ rowGap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
        <TextField
          size='small'
          value={value}
          sx={{ minWidth: { xs: '100%', sm: 260 }, mr: { xs: 0, sm: 4 } }}
          placeholder='Search User'
          onChange={e => handleFilter(e.target.value)}
        />
        {WithAuthorization({
          component:
            <Button onClick={toggle} variant='contained' sx={{ '& svg': { mr: 2 } }}>
              <Icon fontSize='1.125rem' icon='tabler:plus' />
              Add New User
            </Button>,
          requiredPermission: "CREATE_USER"
        })}

      </Box>
    </Box>
  )
}

export default TableHeader
