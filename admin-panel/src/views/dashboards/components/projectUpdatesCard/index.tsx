// ** MUI Imports
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineItem from '@mui/lab/TimelineItem'
import { AvatarGroup, Tooltip } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MuiCardHeader, { CardHeaderProps } from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import moment from 'moment'

// ** Custom Components Imports
import Icon from 'src/@core/components/icon'
import MoreAndLessText from 'src/views/dashboards/components/MoreAndLessText'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { getInitials } from 'src/@core/utils/get-initials'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

const CardHeader = styled(MuiCardHeader)<CardHeaderProps>(({ theme }) => ({
  '& .MuiTypography-root': {
    lineHeight: 1.6,
    fontWeight: 500,
    fontSize: '1.125rem',
    letterSpacing: '0.15px',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1.25rem'
    }
  }
}))

const ProjectUpdatesCard = () => {
  const data = dashboardDummyData.projectUpdates

  const renderClient = (item: any, text: string) => {
    if (text === 'profileImage') {
      if (!item?.addedBy?.imageUrl) {
        return <CustomAvatar src={item?.addedBy?.imageUrl} sx={{ mr: 2.5, width: 38, height: 38 }} />
      }

      return (
        <CustomAvatar skin='light' sx={{ mr: 2.5, width: 38, height: 38, fontSize: '1rem', fontWeight: 500 }}>
          {getInitials(item?.addedBy?.fullName ? item?.addedBy?.fullName : '')}
        </CustomAvatar>
      )
    }

    if (item?.imageUrl) {
      return <CustomAvatar src={item?.imageUrl} sx={{ mr: 2.5, width: 38, height: 38 }} />
    }

    return (
      <CustomAvatar skin='light' sx={{ mr: 2.5, width: 38, height: 38, fontSize: '1rem', fontWeight: 500 }}>
        {getInitials(item?.fullName ? item?.fullName : '')}
      </CustomAvatar>
    )
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { mr: 3 } }}>
            <Icon fontSize='1.25rem' icon='tabler:list-details' />
            <Typography>Project Updates</Typography>
          </Box>
        }
      />
      <CardContent sx={{ height: '450px', overflowY: 'auto' }}>
        <Timeline sx={{ my: 0, py: 0 }}>
          {data.map((item: any, index: number) => (
            <TimelineItem key={index}>
              <TimelineContent sx={{ pt: 0, mt: 0, mb: theme => `${theme.spacing(2)} !important` }}>
                <Box sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {renderClient(item, 'profileImage')}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography sx={{ fontWeight: 500 }}>{item?.addedBy?.fullName}</Typography>
                      <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                        {moment(item?.createdAt).format('DD/MM/YYYY')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                    <Typography variant='body2' sx={{ color: 'warning.main' }}>
                      {item?.project?.name}
                    </Typography>
                    {!item?.isPublic ? (
                      <AvatarGroup
                        className='pull-up'
                        max={5}
                        spacing={6}
                        sx={{ '.MuiAvatarGroup-avatar': { height: 22, width: 22, fontSize: '13px' } }}
                      >
                        {item?.allowed?.map((allowedItem: any, allowedIndex: number) => (
                          <Tooltip
                            key={allowedIndex}
                            title={
                              <Typography variant='body2' sx={{ color: '#ffff' }}>
                                {allowedItem?.fullName}
                              </Typography>
                            }
                            placement='top'
                          >
                            {renderClient(allowedItem, '')}
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    ) : null}
                  </Box>
                </Box>
                <MoreAndLessText sx={{ color: 'text.disabled', mt: 2 }} comment={item?.comment} />
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default ProjectUpdatesCard

