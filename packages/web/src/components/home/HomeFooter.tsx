import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingOutlined, HistoryOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import UpdateElectron from '../update';

const HomeFooter = () => {
  const { t } = useTranslation();

  function handleOpenRecordWin() {
    window.electronAPI ? window.electronAPI.sendReOpenWin() : window.open('/records.html');
  }

  function handleOpenSettingWin() {
    window.electronAPI ? window.electronAPI.sendSeOpenWin() : window.open('/setting.html');
  }

  return (
    <div className="homeFooter">
      <Button
        type="text"
        size="middle"
        className="icon"
        icon={<SettingOutlined />}
        title={t('nav.setting')}
        onClick={handleOpenSettingWin}
      />
      <Button
        type="text"
        className="icon"
        icon={<HistoryOutlined />}
        title={t('nav.record')}
        onClick={handleOpenRecordWin}
      />
      <UpdateElectron />
    </div>
  );
};

export default HomeFooter;
