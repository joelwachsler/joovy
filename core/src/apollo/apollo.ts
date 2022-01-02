import { buildFederatedSchema } from '@apollo/subgraph/dist/buildSubgraphSchema'
import { ApolloServer, gql, ServerInfo } from 'apollo-server'
import { Observable } from 'rxjs'
import logger from '../logger'
import { dumpV1 } from '../playlist/PlaylistTracker'

const typeDefs = gql`
type DumpV1 {
  channels: [ChannelDumpV1!]!
  playlists: [PlaylistV1!]!
}

type ChannelDumpV1 {
  key: String!
  channel: ChannelV1!
}

type ChannelV1 {
  playlists: [String!]!
}

type PlaylistV1 {
  date: Float!
  tracks: [TrackV1!]!
}

type TrackV1 {
  author: AuthorV1!
  name: String!
  link: String!
}

type AuthorV1 {
  id: String!
  username: String!
}

type Query {
  dumpV1: DumpV1!
}
`

const init = () => {
  const server = new ApolloServer({
    schema: buildFederatedSchema([
      {
        typeDefs,
        resolvers: {
          Query: {
            dumpV1: () => dumpV1(),
          },
        },
      },
    ]),
    formatError(err) {
      logger.error(`GraphQL error: ${err}`)
      return err
    },
  })

  const info = new Observable<ServerInfo>(subscribe => {
    server.listen({ port: '3000' }).then(serverInfo => {
      subscribe.next(serverInfo)
    })
  })

  info.subscribe(info => {
    logger.info(`GraphQL available at: ${info.url}`)
    logger.info(`Health available at: ${info.url}.well-known/apollo/server-health`)
  })
}

export default init