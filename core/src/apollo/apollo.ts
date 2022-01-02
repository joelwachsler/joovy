import { buildFederatedSchema } from '@apollo/subgraph/dist/buildSubgraphSchema'
import { ApolloServer, gql, ServerInfo } from 'apollo-server'
import { Observable } from 'rxjs'
import logger from '../logger'
import { DumpV1, dumpV1, restoreV1 } from '../playlist/PlaylistTracker'

const typeDefs = gql`
type Query {
  dumpV1: String!
}

type Mutation {
  restoreV1(restore: String!): Boolean
}
`

const init = () => {
  const server = new ApolloServer({
    schema: buildFederatedSchema([
      {
        typeDefs,
        resolvers: {
          Query: {
            async dumpV1() {
              const res = await dumpV1()
              return JSON.stringify(res)
            },
          },
          Mutation: {
            restoreV1(_: any, { restore }: { restore: string }) {
              return restoreV1(JSON.parse(restore) as DumpV1)
            },
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