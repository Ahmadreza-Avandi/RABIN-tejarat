import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to test Sahab API connectivity
export async function GET(req: NextRequest) {
    try {
        console.log('🔍 Testing Sahab API connectivity...');

        const gatewayToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNDIxMTQ1NDgyNCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiJkZjk4NTY2MTZiZGVhNDE2NGQ4ODMzZmRkYTUyOGUwNCIsImRhdGEiOnsic2VydmljZUlEIjoiZGY1M2E3ODAtMjE1OC00NTI0LTkyNDctYzZmMGJhZDNlNzcwIiwicmFuZG9tVGV4dCI6InJtWFJSIn19.6wao3Mps4YOOFh-Si9oS5JW-XZ9RHR58A1CWgM0DUCg';
        const apiUrl = 'https://partai.gw.isahab.ir/TextToSpeech/v1/speech-synthesys';

        // Test 1: Basic connectivity
        console.log('🔗 Testing basic connectivity to Sahab API...');

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("gateway-token", gatewayToken);

        const requestBody = {
            "data": "تست اتصال",
            "filePath": "true",
            "base64": "0",
            "checksum": "1",
            "speaker": "3"
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            redirect: 'follow',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📊 Sahab API Response Status:', response.status);
        console.log('📊 Sahab API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                test: 'sahab_api_connectivity',
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                message: 'Sahab API returned non-200 status'
            });
        }

        const result = await response.text();
        console.log('📥 Sahab API Raw Response (first 500 chars):', result.substring(0, 500));

        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
        } catch (parseError) {
            return NextResponse.json({
                success: false,
                test: 'sahab_api_parse',
                error: 'Failed to parse JSON response',
                raw_response: result.substring(0, 1000)
            });
        }

        // Test 2: Check response structure
        if (!parsedResult.data || parsedResult.data.status !== 'success') {
            return NextResponse.json({
                success: false,
                test: 'sahab_api_structure',
                parsed_response: parsedResult,
                message: 'Sahab API response structure is invalid'
            });
        }

        // Test 3: Check file path
        if (!parsedResult.data.data || !parsedResult.data.data.filePath) {
            return NextResponse.json({
                success: false,
                test: 'sahab_file_path',
                parsed_response: parsedResult,
                message: 'No file path in Sahab response'
            });
        }

        const audioFilePath = parsedResult.data.data.filePath;
        const audioUrl = `https://${audioFilePath}`;

        console.log('🔗 Testing audio file download from:', audioUrl);

        // Test 4: Try to download the audio file
        try {
            const audioResponse = await fetch(audioUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            console.log('📊 Audio File Response Status:', audioResponse.status);
            console.log('📊 Audio File Response Headers:', Object.fromEntries(audioResponse.headers.entries()));

            if (!audioResponse.ok) {
                return NextResponse.json({
                    success: false,
                    test: 'audio_file_download',
                    audio_url: audioUrl,
                    status: audioResponse.status,
                    statusText: audioResponse.statusText,
                    headers: Object.fromEntries(audioResponse.headers.entries()),
                    message: 'Failed to download audio file'
                });
            }

            const audioBuffer = await audioResponse.arrayBuffer();
            console.log('✅ Audio file downloaded successfully, size:', audioBuffer.byteLength);

            return NextResponse.json({
                success: true,
                test: 'complete',
                sahab_response: {
                    status: parsedResult.data.status,
                    file_path: parsedResult.data.data.filePath,
                    checksum: parsedResult.data.data.checksum
                },
                audio_file: {
                    url: audioUrl,
                    size: audioBuffer.byteLength,
                    content_type: audioResponse.headers.get('content-type')
                },
                message: 'All tests passed successfully'
            });

        } catch (downloadError) {
            console.error('❌ Audio download error:', downloadError);
            return NextResponse.json({
                success: false,
                test: 'audio_file_download',
                audio_url: audioUrl,
                error: downloadError.message,
                message: 'Failed to download audio file'
            });
        }

    } catch (error) {
        console.error('❌ Debug test error:', error);
        return NextResponse.json({
            success: false,
            test: 'general_error',
            error: error.message,
            message: 'General error in debug test'
        });
    }
}