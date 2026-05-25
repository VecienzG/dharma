import { gql } from '@apollo/client';

export const UPDATE_DHARMA_COLLABORATOR_PAYOUT = gql`
  mutation UpdateDharmaCollaboratorPayout(
    $id: UUID!
    $input: DharmaCollaboratorPayoutUpdateInput!
  ) {
    updateDharmaCollaboratorPayout(id: $id, data: $input) {
      id
      status
      paidAt
    }
  }
`;
