// Include fs module
var fs = require('fs');
var Excel = require('exceljs');
var path = require('path');
var filesServerController = require(path.resolve('./modules/core/server/controllers/files.server.controller'));

xxx();

async function xxx() {
// Use fs.readFile() method to read the file
  let rawdata = fs.readFileSync('config/locales/client/ja.json');

  let student = JSON.parse(rawdata);

  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile('export_lang/lang.xlsx');
  var wsExport = workbook.getWorksheet('WEB');
  var row = 2;

  const outputExcelFileName = 'export_lang/lang_export.xlsx';

  // eslint-disable-next-line array-callback-return
  Object.keys(student).map(key => {
    filesServerController.setValue(wsExport, row, 1, row - 1);
    filesServerController.setValue(wsExport, row, 2, '');
    filesServerController.setValue(wsExport, row, 3, key);

    filesServerController.setValue(wsExport, row, 4, 'ラベル(Label)', 'center');

    if (key.toString().includes('.label')) {
      filesServerController.setValue(wsExport, row, 4, 'ラベル(Label)', 'center');
    }

    if (key.toString().includes('.placeholder')) {
      filesServerController.setValue(wsExport, row, 4, 'プレスホルダー(Placeholder)');
    }

    if (key.toString().includes('.error.')) {
      filesServerController.setValue(wsExport, row, 4, 'エラーメッセージ (Error message)');
    }

    if (key.toString().includes('message.confirm')) {
      filesServerController.setValue(wsExport, row, 4, '確認メッセージ (Confirm message)');
    }

    if (key.toString().includes('message.save_success')) {
      filesServerController.setValue(wsExport, row, 4, '成功メッセージ (Done message)');
    }

    if (key.toString().includes('page_title')) {
      filesServerController.setValue(wsExport, row, 4, '画面タイトル(Screen title)');
    }

    if (key.toString().includes('.table.')) {
      filesServerController.setValue(wsExport, row, 4, 'テーブルヘッダー (Table header)');
    }

    filesServerController.setValue(wsExport, row, 5, '反映済(Sync)');
    filesServerController.setValue(wsExport, row, 6, '');
    filesServerController.setValue(wsExport, row, 7, `=IF(F${row}=""; ""; GOOGLETRANSLATE(F${row}; "vi"; "ja"))`);
    filesServerController.setValue(wsExport, row, 8, student[key]);
    filesServerController.setValue(wsExport, row, 9, '');
    filesServerController.setValue(wsExport, row, 10, '');
    row++;
  });

  await workbook.xlsx.writeFile(outputExcelFileName);

}
