#NoEnv
#SingleInstance Force
SendMode Input
SetWorkingDir %A_ScriptDir%

; 設定
serverUrl := "http://localhost:54321"
hotkeyRegister := "^!a"  ; Ctrl+Alt+Aで単語登録
hotkeySearch := "^!s"    ; Ctrl+Alt+Sで単語検索

; 単語登録ホットキー
~%hotkeyRegister%::
    ; 選択中のテキストを取得
    Clipboard := ""
    Send ^c
    ClipWait, 1
    if (Clipboard = "") {
        MsgBox テキストが選択されていません
        return
    }

    ; 単語登録ダイアログ表示
    InputBox, description, 単語登録, 説明を入力してください,, 400, 150
    if ErrorLevel  ; キャンセルされた場合
        return

    ; API呼び出し
    word := {"text": Clipboard, "description": description, "tags": []}
    jsonData := JSON.Dump(word)
    
    whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    whr.Open("POST", serverUrl . "/api/words", false)
    whr.SetRequestHeader("Content-Type", "application/json")
    whr.Send(jsonData)
    
    if (whr.Status = 201) {
        MsgBox 単語を登録しました: %Clipboard%
    } else {
        MsgBox 登録に失敗しました (エラーコード: %whr.Status%)
    }
return

; 単語検索ホットキー
~%hotkeySearch%::
    ; 選択中のテキストを取得
    Clipboard := ""
    Send ^c
    ClipWait, 1
    if (Clipboard = "") {
        MsgBox テキストが選択されていません
        return
    }

    ; API呼び出し
    whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    whr.Open("GET", serverUrl . "/api/words?q=" . UriEncode(Clipboard), false)
    whr.Send()
    
    if (whr.Status = 200) {
        response := JSON.Load(whr.ResponseText)
        if (response.Length() > 0) {
            result := ""
            for i, word in response {
                result .= word.text . "`n" . word.description . "`n`n"
                if (i >= 5)  ; 最大5件表示
                    break
            }
            MsgBox 検索結果:`n`n%result%
        } else {
            MsgBox 該当する単語が見つかりませんでした
        }
    } else {
        MsgBox 検索に失敗しました (エラーコード: %whr.Status%)
    }
return

; URIエンコード関数
UriEncode(str) {
    VarSetCapacity(var, StrPut(str, "UTF-8"))
    StrPut(str, &var, "UTF-8")
    f := A_FormatInteger
    SetFormat, IntegerFast, H
    While code := NumGet(var, A_Index - 1, "UChar") {
        if (code >= 0x30 && code <= 0x39 ; 0-9
            || code >= 0x41 && code <= 0x5A ; A-Z
            || code >= 0x61 && code <= 0x7A) { ; a-z
            encoded .= Chr(code)
        } else if (code = 0x20) {
            encoded .= "+"
        } else {
            encoded .= "%" . SubStr("0" . SubStr(code, 3), -1)
        }
    }
    SetFormat, IntegerFast, %f%
    Return encoded
}

; JSON関数 (AutoHotkey用シンプル実装)
class JSON {
    static Load(json) {
        json := Trim(json)
        if (SubStr(json, 1, 1) = "{" && SubStr(json, 0) = "}") {
            obj := {}
            json := SubStr(json, 2, StrLen(json)-2)
            Loop, Parse, json, `,, `"
            {
                if (A_LoopField = "")
                    continue
                pos := InStr(A_LoopField, ":")
                key := Trim(SubStr(A_LoopField, 1, pos-1), " `t`r`n""")
                val := Trim(SubStr(A_LoopField, pos+1), " `t`r`n")
                if (SubStr(val, 1, 1) = "`"" && SubStr(val, 0) = "`"")
                    val := SubStr(val, 2, StrLen(val)-2)
                obj[key] := val
            }
            return obj
        } else if (SubStr(json, 1, 1) = "[" && SubStr(json, 0) = "]") {
            arr := []
            json := SubStr(json, 2, StrLen(json)-2)
            Loop, Parse, json, `,, `"
            {
                if (A_LoopField = "")
                    continue
                val := Trim(A_LoopField, " `t`r`n")
                if (SubStr(val, 1, 1) = "`"" && SubStr(val, 0) = "`"")
                    val := SubStr(val, 2, StrLen(val)-2)
                arr.Push(val)
            }
            return arr
        }
        return json
    }

    static Dump(obj) {
        if (IsObject(obj)) {
            if (obj.Length()) {  ; Array
                str := "["
                for i, val in obj {
                    str .= (i > 1 ? "," : "") . this.Dump(val)
                }
                return str . "]"
            } else {  ; Object
                str := "{"
                first := true
                for key, val in obj {
                    str .= (first ? "" : ",") . """" . key . """:" . this.Dump(val)
                    first := false
                }
                return str . "}"
            }
        } else if (obj ~= "^-?\d+\.?\d*$") {
            return obj
        } else {
            return """" . StrReplace(StrReplace(obj, "\", "\\"), """", "\""") . """"
        }
    }
}
