// Libraries
import React, {PureComponent, MouseEvent} from 'react'
import _ from 'lodash'
import CopyToClipboard from 'react-copy-to-clipboard'

// Decorator
import {ErrorHandling} from 'src/shared/decorators/errors'

// Components
import {Button, ComponentSize, ComponentColor} from 'src/clockface'

// Types
import {NotificationAction} from 'src/types'
import {
  copyToClipboardSuccess,
  copyToClipboardFailed,
} from 'src/shared/copy/notifications'

export interface Props {
  notify: NotificationAction
  authToken: string
  configID: string
}

@ErrorHandling
class TelegrafInstructions extends PureComponent<Props> {
  public render() {
    const exportToken = `export INFLUX_TOKEN=${this.props.authToken}`
    const configScript = `telegraf -config http://localhost:9999/api/v2/telegrafs/${
      this.props.configID
    }`
    return (
      <>
        <h3 className="wizard-step--title">Listen for Streaming Data</h3>
        <h5 className="wizard-step--sub-title">
          You have selected streaming data sources. Follow the instructions
          below to begin listening for incoming data.
        </h5>
        <div className="wizard-step--body">
          <h6>Install</h6>
          <p>
            You can download the binaries directly from the downloads page or
            from the releases section.{' '}
          </p>
          <h6>Start Data Stream</h6>
          <p>
            After installing the telegraf client, save this environment
            variable. run the following command.
          </p>
          <p className="wizard-step--body-snippet">
            {exportToken}
            <CopyToClipboard text={exportToken} onCopy={this.handleCopyAttempt}>
              <Button
                customClass="wizard-step--body-copybutton"
                size={ComponentSize.Small}
                color={ComponentColor.Default}
                titleText="copy to clipboard"
                text="Copy"
                onClick={this.handleClickCopy}
              />
            </CopyToClipboard>
          </p>
          <p>Run the following command.</p>
          <p className="wizard-step--body-snippet">
            {configScript}
            <CopyToClipboard
              text={configScript}
              onCopy={this.handleCopyAttempt}
            >
              <Button
                customClass="wizard-step--body-copybutton"
                size={ComponentSize.Small}
                color={ComponentColor.Default}
                titleText="copy to clipboard"
                text="Copy"
                onClick={this.handleClickCopy}
              />
            </CopyToClipboard>
          </p>
        </div>
      </>
    )
  }

  private handleClickCopy = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
  }

  private handleCopyAttempt = (
    copiedText: string,
    isSuccessful: boolean
  ): void => {
    const {notify} = this.props
    const text = copiedText.slice(0, 30).trimRight()
    const truncatedText = `${text}...`
    const title = 'Script '

    if (isSuccessful) {
      notify(copyToClipboardSuccess(truncatedText, title))
    } else {
      notify(copyToClipboardFailed(truncatedText, title))
    }
  }
}

export default TelegrafInstructions
