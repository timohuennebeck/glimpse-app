Pod::Spec.new do |s|
  s.name           = 'GlimpseWidget'
  s.version        = '0.1.0'
  s.summary        = 'Writes the homescreen widget snapshot into the shared App Group container.'
  s.description    = 'The app half of the Glimpse homescreen widget: snapshot, cached photo, reload.'
  s.author         = ''
  s.homepage       = 'https://github.com/timohuennebeck/glimpse-app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
