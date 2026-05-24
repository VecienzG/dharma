import { gql } from '@apollo/client';

// Reference query for the dharmaAiMemory custom object.
// Twenty generates the real document dynamically through
// useFindManyRecordsQuery when given objectNameSingular: 'dharmaAiMemory'.
// This file is kept for discoverability and direct Apollo usage if needed.
export const FIND_DHARMA_MEMORIES = gql`
  query FindDharmaAiMemories(
    $filter: dharmaAiMemoryFilterInput
    $orderBy: [dharmaAiMemoryOrderByInput]
    $limit: Int
  ) {
    dharmaAiMemories(filter: $filter, orderBy: $orderBy, first: $limit) {
      edges {
        node {
          id
          kind
          content
          tags
          score
          lastUsedAt
          source
          createdAt
          updatedAt
        }
      }
    }
  }
`;
