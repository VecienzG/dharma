import { gql } from '@apollo/client';

// Reference mutation for dharmaAiMemory soft delete.
// Twenty generates the real mutation dynamically via useDeleteOneRecord.
export const DELETE_DHARMA_MEMORY = gql`
  mutation DeleteDharmaAiMemory($id: ID!) {
    deleteDharmaAiMemory(id: $id) {
      id
    }
  }
`;
