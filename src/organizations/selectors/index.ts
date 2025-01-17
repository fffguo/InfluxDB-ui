// Libraries
import {get} from 'lodash'

// Types
import {AppState, Organization} from 'src/types'

interface OrganizationWithStorageType extends Organization {
  defaultStorageType?: string
}

export const isOrgIOx = (state: AppState): boolean => {
  const org: OrganizationWithStorageType = getOrg(state)

  return Boolean(
    org &&
      org.defaultStorageType &&
      org.defaultStorageType.toLowerCase() === 'iox'
  )
}

export const getOrg = (state: AppState): Organization => {
  return get(state, 'resources.orgs.org', null)
}

export const getOrgByID = (state: AppState, id: string) => {
  const orgs = get(state, 'resources.orgs.byID')

  if (!orgs) {
    throw new Error('No orgs have been set')
  }

  if (!orgs[id]) {
    throw new Error(
      `No org with id "${id}" found in orgs state: ${JSON.stringify(
        orgs,
        null,
        2
      )}"`
    )
  }

  return orgs[id]
}
