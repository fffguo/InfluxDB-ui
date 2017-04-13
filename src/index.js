import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import {Router, Route, useRouterHistory} from 'react-router'
import {createHistory} from 'history'
import {syncHistoryWithStore} from 'react-router-redux'

import App from 'src/App'
import AlertsApp from 'src/alerts'
import CheckSources from 'src/CheckSources'
import {HostsPage, HostPage} from 'src/hosts'
import {KubernetesPage} from 'src/kubernetes'
import {Login, UserIsAuthenticated, UserIsNotAuthenticated} from 'src/auth'
import {KapacitorPage, KapacitorRulePage, KapacitorRulesPage, KapacitorTasksPage} from 'src/kapacitor'
import DataExplorer from 'src/data_explorer'
import {DashboardsPage, DashboardPage} from 'src/dashboards'
import {CreateSource, SourcePage, ManageSources} from 'src/sources'
import {AdminPage} from 'src/admin'
import NotFound from 'src/shared/components/NotFound'
import configureStore from 'src/store/configureStore'
import {getMe} from 'shared/apis'
import {authRequested, authReceived, meRequested, meReceived} from 'shared/actions/auth'
import {disablePresentationMode} from 'shared/actions/app'
import {publishNotification as notify} from 'shared/actions/notifications'
import {loadLocalStorage} from './localStorage'

import 'src/style/chronograf.scss'

import {HTTP_FORBIDDEN, HEARTBEAT_INTERVAL} from 'shared/constants'

const rootNode = document.getElementById('react-root')

let browserHistory
const basepath = rootNode.dataset.basepath
window.basepath = basepath
if (basepath) {
  browserHistory = useRouterHistory(createHistory)({
    basename: basepath, // this is written in when available by the URL prefixer middleware
  })
} else {
  browserHistory = useRouterHistory(createHistory)({
    basename: "",
  })
}

const store = configureStore(loadLocalStorage(), browserHistory)
const {dispatch} = store

browserHistory.listen(() => {
  dispatch(disablePresentationMode())
})

window.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    dispatch(disablePresentationMode())
  }
})

const history = syncHistoryWithStore(browserHistory, store)

const Root = React.createClass({
  componentWillMount() {
    this.checkAuth()
  },

  async checkAuth() {
    dispatch(authRequested())
    dispatch(meRequested())
    try {
      await this.startHeartbeat({shouldDispatchResponse: true})
    } catch (error) {
      console.error(error)
    }
  },

  async startHeartbeat({shouldDispatchResponse}) {
    try {
      const {data: me, auth} = await getMe()
      if (shouldDispatchResponse) {
        dispatch(authReceived(auth))
        dispatch(meReceived(me))
      }

      setTimeout(this.startHeartbeat.bind(null, {shouldDispatchResponse: false}), HEARTBEAT_INTERVAL)
    } catch (error) {
      if (error.status === HTTP_FORBIDDEN) {
        const {auth: {me}} = store.getState()
        if (me === null) {
          dispatch(notify('error', 'Please login to use Chronograf.'))
        } else {
          dispatch(notify('error', 'Session timed out. Please login again.'))
        }
      } else {
        dispatch(notify('error', 'Cannot communicate with server.'))
      }
      if (error.auth) {
        dispatch(authReceived(error.auth))
        dispatch(meReceived(null))
      }
    }
  },

  render() {
    return (
      <Provider store={store}>
        <Router history={history}>
          <Route path="/" component={UserIsAuthenticated(CheckSources)} />
          <Route path="login" component={UserIsNotAuthenticated(Login)} />
          <Route path="sources/new" component={UserIsAuthenticated(CreateSource)} />
          <Route path="sources/:sourceID" component={UserIsAuthenticated(App)}>
            <Route component={CheckSources}>
              <Route path="manage-sources" component={ManageSources} />
              <Route path="manage-sources/new" component={SourcePage} />
              <Route path="manage-sources/:id/edit" component={SourcePage} />
              <Route path="chronograf/data-explorer" component={DataExplorer} />
              <Route path="hosts" component={HostsPage} />
              <Route path="hosts/:hostID" component={HostPage} />
              <Route path="kubernetes" component={KubernetesPage} />
              <Route path="kapacitor-config" component={KapacitorPage} />
              <Route path="kapacitor-tasks" component={KapacitorTasksPage} />
              <Route path="alerts" component={AlertsApp} />
              <Route path="dashboards" component={DashboardsPage} />
              <Route path="dashboards/:dashboardID" component={DashboardPage} />
              <Route path="alert-rules" component={KapacitorRulesPage} />
              <Route path="alert-rules/:ruleID" component={KapacitorRulePage} />
              <Route path="alert-rules/new" component={KapacitorRulePage} />
              <Route path="admin" component={AdminPage} />
            </Route>
          </Route>
          <Route path="*" component={NotFound} />
        </Router>
      </Provider>
    )
  },
})

if (rootNode) {
  render(<Root />, rootNode)
}
