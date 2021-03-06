import config from 'config'
import { Selector } from 'testcafe'

const files = {
  url: new RegExp(
    `${config.get('pubsweet-server.baseUrl')}/submit/[a-f0-9-]{36}/files`,
  ),
  editor: Selector('[name="coverLetter"] div[contenteditable=true]'),
  manuscriptUpload: Selector('[data-test-id=upload]>input'),
  supportingFilesUpload: Selector('[data-test-id=supportingFilesUpload]>input'),
  supportingFilesRemove: Selector('[data-test-id=supportingFilesRemove]'),
  supportingFile: Selector('[data-test-id=file-block-name]'),
  supportingFileError: Selector('[data-test-id=file-block-error]'),
  fileName: Selector('[data-test-id=fileName]'),
  dropzoneMessage: Selector('[data-test-id=dropzoneMessage]'),
  ongoingFileUploadError: Selector('[data-test-id=error-fileStatus]'),
  manuscriptDownloadLink: Selector('[data-test-id=manusctipt-download-link]'),
}

export default files
