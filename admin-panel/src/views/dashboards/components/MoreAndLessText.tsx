import { Box, Button } from '@mui/material'
import { useState } from 'react'

type Props = {
  comment: string
  sx?: any
}

const MoreAndLessText = ({ comment, ...sx }: Props) => {
  const [readMore, setReadMore] = useState<boolean>(false)

  return (
    <>
      {readMore ? (
        <Box {...sx}>
          {comment}
          <Button style={{ fontSize: '12px', textDecoration: 'underline' }} onClick={() => setReadMore(false)}>
            Show less
          </Button>
        </Box>
      ) : comment?.length > 300 ? (
        <Box {...sx}>
          {comment.slice(0, 200)}
          <Button style={{ fontSize: '12px', textDecoration: 'underline' }} onClick={() => setReadMore(true)}>
            Show more
          </Button>
        </Box>
      ) : (
        <Box {...sx} style={{ wordBreak: 'break-all' }}>
          {comment}
        </Box>
      )}
    </>
  )
}

export default MoreAndLessText
