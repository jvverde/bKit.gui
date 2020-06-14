#ExpandEnvStrings $0 %COMSPEC%
#ExecWait '"$0" /C "c:\path\to\batch.cmd" "quoted param" normalparam "c:\last param"'
#  SetOutPath $INSTDIR\${APPLICATION_DIR}
#    ExpandEnvStrings $0 %COMSPEC%
#    nsExec::ExecToStack '"C:\path-tobatch-file\commands.bat"'

!macro customInstall
  ExecWait '"$INSTDIR\bkit-client\setup.bat"'
!macroend