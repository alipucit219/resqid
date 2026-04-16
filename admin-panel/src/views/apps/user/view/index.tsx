import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Chip, Divider, Grid, Typography } from '@mui/material'
import FallbackSpinner from 'src/@core/components/spinner'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { getInitials } from 'src/@core/utils/get-initials'
import { singleUserDetail } from 'src/services/user.service'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type Props = {
  id: string
}

type UserDetailState = {
  user: any
  medicalProfile: any
  medicalSummary: any
  emergencyContacts: any[]
}

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
    <Typography sx={{ minWidth: 150, fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
    <Typography sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>{value || '—'}</Typography>
  </Box>
)

const UserView = ({ id }: Props) => {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<UserDetailState>({
    user: null,
    medicalProfile: null,
    medicalSummary: null,
    emergencyContacts: []
  })

  useEffect(() => {
    const getData = async () => {
      try {
        const [userResult, medicalProfileResult, medicalSummaryResult, emergencyContactsResult] = await Promise.allSettled([
          singleUserDetail(id),
          apiClient.get(`v2/admin/medical-profiles/${id}`),
          apiClient.get(`v2/admin/medical-summaries/${id}`),
          apiClient.get(`v2/admin/emergency-contacts/${id}`)
        ])

        if (userResult.status !== 'fulfilled') {
          throw userResult.reason
        }

        setData({
          user: userResult.value,
          medicalProfile:
            medicalProfileResult.status === 'fulfilled' && medicalProfileResult.value.data?.id
              ? medicalProfileResult.value.data
              : null,
          medicalSummary:
            medicalSummaryResult.status === 'fulfilled' && medicalSummaryResult.value.data?.id
              ? medicalSummaryResult.value.data
              : null,
          emergencyContacts:
            emergencyContactsResult.status === 'fulfilled' ? emergencyContactsResult.value.data?.contacts || [] : []
        })
      } catch (error) {
        modifyError(error)
        setErrorMessage('Unable to load user details right now.')
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, [id])

  if (loading) {
    return (
      <Grid
        container
        spacing={0}
        direction='column'
        alignItems='center'
        justifyContent='center'
        style={{ minHeight: '100vh' }}
      >
        <Grid item xs={3}>
          <FallbackSpinner />
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      {errorMessage ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography sx={{ color: 'error.main' }}>{errorMessage}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', py: 10 }}>
            <CustomAvatar skin='light' color='info' sx={{ width: 88, height: 88, mb: 4, fontSize: '2rem' }}>
              {getInitials(data.user?.fullName || 'User')}
            </CustomAvatar>
            <Typography variant='h5' sx={{ mb: 2 }}>
              {data.user?.fullName || 'User'}
            </Typography>
            <Chip label={data.user?.isActive ? 'Active' : 'Inactive'} color={data.user?.isActive ? 'success' : 'default'} />
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant='h6' sx={{ mb: 3 }}>
              User Details
            </Typography>
            <DetailRow label='Email' value={data.user?.email} />
            <DetailRow label='Role' value={data.user?.role} />
            <DetailRow label='Phone Number' value={data.user?.phoneNumber} />
            <DetailRow label='CNIC' value={data.user?.cnic} />
            <DetailRow label='Address' value={data.user?.address} />
            <DetailRow label='Gender' value={data.user?.gender} />
            <DetailRow
              label='Date of Birth'
              value={data.user?.dateOfBirth ? new Date(data.user.dateOfBirth).toLocaleDateString() : '—'}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ mb: 3 }}>
                  Medical Profile
                </Typography>
                <DetailRow label='Blood Group' value={data.medicalProfile?.bloodGroup} />
                <DetailRow label='Age' value={data.medicalProfile?.age} />
                <DetailRow label='CNIC' value={data.medicalProfile?.cnic} />
                <DetailRow label='Address' value={data.medicalProfile?.address} />
                <DetailRow label='Allergies' value={(data.medicalProfile?.allergies || []).join(', ')} />
                <DetailRow label='Conditions' value={(data.medicalProfile?.chronicConditions || []).join(', ')} />
                <DetailRow label='Medications' value={(data.medicalProfile?.medications || []).join(', ')} />
                <DetailRow label='Past Surgeries' value={(data.medicalProfile?.pastSurgeries || []).join(', ')} />
                <DetailRow label='Emergency Notes' value={data.medicalProfile?.emergencyNotes} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ mb: 3 }}>
                  Medical Summary
                </Typography>
                <DetailRow label='Hospital' value={data.medicalSummary?.hospitalName} />
                <DetailRow label='Doctor' value={data.medicalSummary?.doctorName} />
                <DetailRow label='Disease Since' value={data.medicalSummary?.diseaseStartingYear} />
                <DetailRow label='Duration' value={data.medicalSummary?.treatmentDuration} />
                <DetailRow label='Status' value={data.medicalSummary?.treatmentStatus} />
                <DetailRow label='Current Medications' value={(data.medicalSummary?.currentMedications || []).join(', ')} />
                <DetailRow label='Notes' value={data.medicalSummary?.notes} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ mb: 3 }}>
                  Emergency Contacts
                </Typography>
                {data.emergencyContacts.length ? (
                  data.emergencyContacts.map(contact => (
                    <Box key={contact.id} sx={{ py: 2 }}>
                      <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {contact.isPrimary ? 'Primary Contact' : 'Contact'}
                      </Typography>
                      <DetailRow label='Name' value={contact.name} />
                      <DetailRow label='Email' value={contact.email} />
                      <DetailRow label='Phone' value={contact.phoneNumber} />
                      <DetailRow label='Relationship' value={contact.relationship} />
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: 'text.secondary' }}>No emergency contacts available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default UserView
