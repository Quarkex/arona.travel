select c.codcontenido, rtrim ('"' || c.codsubtipocont || '",' || subtipos.codsubtipos, ',') codsubtipocont, sbt.descripcion subtipo_principal, c.codcategoria, ctg.NOMBRE categoria, 
c.imagen, c.WEB_PROPIA, c.documento, c.zona codzona, zn.NOMBRE zona, c.f_inicio_pub, c.f_fin_pub, c.f_revision, c.f_baja, 
c.novedad, c.f_inicio_nov, c.f_fin_nov, c.propietario codpropietario, prop.nombre propietario, ci.titulo, ci.descripcion_comun, 
ci.datos_interes, ci.palabras_clave, tra.codplazo, plazoi.nombre plazo, tra.codformainic, formainici.descripcion formainic,
tra.codestjer, estjer.nombre estjerarquica, tra.codefecpres, efpresi.descripcion efectopresunto, tra.codfinvia, finviai.nombre finvia,
tra.uid_tramite, tra.plazo_tramitacion, tra.f_inicio, tra.f_fin, tra.actuacion_tel, trai.horario, trai.doc_aportar, trai.lugar,
trai.uso_comun, trai.solicitante, trai.requisitos, trai.datos_pago, trai.recursos, trai.normativa, trai.observaciones, medio_contacto, 
c.publicado, c.REF_VPORTAL,
indic_tramite.CodigosIndicadores, indic_tramite.NombreIndicadores, indic_tramite.EtiquetaIndicadores, indic_tramite.ValoresIndicadoresLista,
indic_tramite.ValoresIndicadores, areasubarea.codareas, areasubarea.areas, areasubarea.codsubareas, areasubarea.subareas,
subtipos.subtipos, recursos_relacionados.codrecursos, contenidos_relacionados.codcontenidosrelacionados, 
sectores_poblacion.codsectorespoblacion, sectores_poblacion.sectorespoblacion, FModif.FModificacion
from contenido c 
inner join contenido_idioma ci on c.codcontenido = ci.codcontenido
inner join tramite tra on tra.codcontenido = c.codcontenido
inner join tramite_idioma trai on c.codcontenido = trai.codcontenido and trai.codidioma = ci.codidioma
inner join subtipo_contenido_idioma sbt on sbt.CODSUBTIPOCONT = c.CODSUBTIPOCONT and sbt.codidioma = 1
inner join categoria_idioma ctg on ctg.codcategoria = c.codcategoria and ctg.codidioma = 1
inner join zona zn on zn.codzona = c.zona 
inner join est_organica prop on prop.codestorg = c.propietario
inner join unidad_plazo_tram_idioma plazoi on plazoi.codplazo = tra.codplazo and plazoi.codidioma = 1
inner join FORMA_INICIACION_IDIOMA formainici on formainici.codformainic = tra.CODFORMAINIC and formainici.codidioma = 1
inner join EST_JERARQUICA estjer on estjer.codestjer = tra.codestjer
inner join ef_presunto_idioma efpresi on efpresi.CODEFECPRES = tra.CODEFECPRES and efpresi.codidioma = 1
inner join fin_via_adm_idioma finviai on finviai.CODFINVIA = tra.codfinvia and finviai.codidioma = 1

inner join (select cas.codcontenido, '"' || listagg (cas.codarea, '","') within group (order by ari.descripcion, sri.DESCRIPCION) || '"' codareas, '"' || listagg (cas.codsubarea, '","') within group (order by ari.descripcion, sri.DESCRIPCION) || '"' codsubareas,
'"' || listagg (ari.descripcion, '","') within group (order by ari.descripcion, sri.DESCRIPCION) || '"' areas, '"' || listagg (sri.DESCRIPCION, '","') within group (order by ari.descripcion, sri.DESCRIPCION) || '"' subareas
from CONTENIDOS_AREAS_SUBAREAS cas 
inner join area_idioma ari on ari.codarea = cas.codarea
inner join subarea_idioma sri on sri.codsubarea = cas.codsubarea
where ari.codidioma = 1 and sri.codidioma = 1
group by cas.codcontenido) areasubarea on areasubarea.codcontenido = c.codcontenido

left join (select crec.codcontenido, crec.codidioma, '"' || listagg (crec.codrecurso, '","') within group (order by crec.codcontenido, crec.codrecurso) || '"' codrecursos
from contenido_recurso crec
group by crec.codcontenido, crec.codidioma) recursos_relacionados on recursos_relacionados.codcontenido = c.codcontenido and ci.codidioma = recursos_relacionados.codidioma

left join (select crel.CODCONTENIDO_ORIGEN, '"' || listagg (crel.CODCONTENIDO_DESTINO, '","') within group (order by crel.CODCONTENIDO_DESTINO) || '"' codcontenidosrelacionados
from contenidos_relacionados crel
group by crel.CODCONTENIDO_ORIGEN) contenidos_relacionados on contenidos_relacionados.CODCONTENIDO_ORIGEN = c.codcontenido

left join (select cs.codcontenido, '"' || listagg (csi.CODSUBTIPOCONT, '","') within group (order by csi.descripcion) || '"' codsubtipos, '"' || listagg (csi.descripcion, '","') within group (order by csi.descripcion) || '"' subtipos
from CONTENIDOS_SUBTIPOS cs inner join SUBTIPO_CONTENIDO_IDIOMA csi on cs.CODSUBTIPOCONT = csi.CODSUBTIPOCONT
where csi.codidioma = 1
group by cs.codcontenido) subtipos on subtipos.codcontenido = c.codcontenido

left join (select spc.CODCONTENIDO, '"' || listagg (spc.CODSECTORPOBLAC, '","') within group (order by spc.CODSECTORPOBLAC) || '"' codsectorespoblacion,
'"' || listagg (spi.NOMBRE, '","') within group (order by spc.CODSECTORPOBLAC) || '"' sectorespoblacion
from sector_poblacion_contenido spc inner join sector_poblacion_idioma spi on spi.CODSECTORPOBLAC = spc.CODSECTORPOBLAC and
  spi.codidioma = spc.codidioma
where spi.codidioma = 1
group by spc.CODCONTENIDO) sectores_poblacion on sectores_poblacion.codcontenido = c.codcontenido

left join (select HWF.CODCONTENIDO, HWFI.CODIDIOMA, MAX (HWF.F_FIN) FModificacion
from HISTORICO_WF HWF INNER JOIN HISTORICO_WF_IDIOMA HWFI ON HWF.CODWF = HWFI.CODWF
WHERE HWFI.CODTAREA = 2 and HWF.CODWF > 0 
group by HWF.CODCONTENIDO, HWFI.CODIDIOMA) FModif on FModif.codcontenido = c.codcontenido + 1 and FModif.codidioma = ci.codidioma

left join (select igc.codcontenido, igc.codidioma, '"' || Listagg (igc.CODINDICADOR, '","') within group (order by igc.codcontenido, igc.codindicador, igc.codidioma) || '"' CodigosIndicadores,
'"' || Listagg (igi.NOMBRE, '","') within group (order by igc.codcontenido, igc.codindicador, igc.codidioma) || '"' NombreIndicadores,
'"' || Listagg (igi.descripcion, '","') within group (order by igc.codcontenido, igc.codindicador, igc.codidioma) || '"' EtiquetaIndicadores,
'"' || Listagg (igli.descripcion, '","') within group (order by igc.codcontenido, igc.codindicador, igc.codidioma) || '"' ValoresIndicadoresLista,
'"' || Listagg (CASE ig.tipo_campo 
WHEN 1 Then to_char (igc.valor_NUM)
WHEN 2 Then nvl (igc.valor_FECHA, '-1')
WHEN 3 Then nvl (igc.valor_FECHA, '-1')
WHEN 4 Then nvl (igc.valor_TEXTO, '-1')
WHEN 5 Then 'TEXTO_LARGO'
WHEN 6 Then to_char (igc.codlista)
WHEN 7 Then to_char (igc.CODLISTA) 
  END, '","' ) within group (order by igc.codcontenido, igc.codindicador, igc.codidioma) || '"' ValoresIndicadores  
from IND_GESTION_CONTENIDO igc inner join ind_gestion ig on ig.CODINDICADOR = igc.CODINDICADOR
INNER JOIN IND_gESTION_IDIOMA igi on igc.codindicador = igi.codindicador and igc.codidioma = igi.codidioma
inner join contenido on contenido.codcontenido = igc.codcontenido
left join ind_gestion_lista_idioma igli on igli.codlista = igc.codlista and igc.codidioma = igli.codidioma
group by igc.codcontenido, igc.codidioma) indic_tramite on indic_tramite.codcontenido = c.codcontenido 
and ci.codidioma= indic_tramite.codidioma

where ci.codidioma = 1 and c.publicado = 2 and c.ref_vportal = -1 